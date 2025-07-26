import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
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
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      }));

      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.isRead).length);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching notifications:', error);
      setLoading(false);
    });

    return unsubscribe;
  }, [user, role]);

  const markAsRead = async (notificationId) => {
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