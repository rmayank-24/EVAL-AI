import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

// Define the Notification interface and EXPORT IT for use in other components
export interface Notification {
  id: string;
  type: 'review' | 'student_comment' | 'teacher_comment' | 'general'; // Added 'type'
  text: string; // Renamed 'message' to 'text' for consistency
  isRead: boolean;
  createdAt: Date | null;
  studentUid?: string;
  teacherUid?: string;
  teacherEmail?: string; // Added teacherEmail
  studentEmail?: string; // Added studentEmail
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user, role } = useAuth();

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    const notificationsRef = collection(db, 'notifications');
    let q;

    if (role === 'student') {
      q = query(
        notificationsRef,
        where('studentUid', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
    } else if (role === 'teacher') {
      q = query(
        notificationsRef,
        where('teacherUid', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
    } else {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs: Notification[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          type: (data.type as Notification['type']) || 'general', // Map 'type'
          text: data.message || '', // Map original 'message' field to 'text'
          isRead: data.isRead || false,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : null,
          studentUid: data.studentUid,
          teacherUid: data.teacherUid,
          teacherEmail: data.teacherEmail || undefined, // Map teacherEmail
          studentEmail: data.studentEmail || undefined, // Map studentEmail
        };
      });

      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.isRead).length);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching notifications:', error);
      setLoading(false);
    });

    return unsubscribe;
  }, [user, role]);

  const markAsRead = async (notificationId: string) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, { isRead: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.isRead);
      const promises = unreadNotifications.map(n =>
        updateDoc(doc(db, 'notifications', n.id), { isRead: true })
      );
      await Promise.all(promises);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
  };
};