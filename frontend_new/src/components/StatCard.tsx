import { ElementType } from 'react';
import { motion } from 'framer-motion';

// Define the types for the component's props
interface StatCardProps {
  title: string;
  value: string | number;
  icon: ElementType;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'cyan';
}

// Define a type for the color mapping object
type ColorMap = {
  [key: string]: string;
};

const StatCard = ({ title, value, icon: Icon, color = 'blue' }: StatCardProps) => {
  const colorClasses: ColorMap = {
    blue: 'bg-blue-500/10 text-blue-400',
    green: 'bg-green-500/10 text-green-400',
    yellow: 'bg-yellow-500/10 text-yellow-400',
    red: 'bg-red-500/10 text-red-400',
    purple: 'bg-purple-500/10 text-purple-400',
    cyan: 'bg-cyan-500/10 text-cyan-400',
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={cardVariants}
      className="bg-gray-900/30 border border-white/10 rounded-xl p-6 backdrop-blur-lg hover:bg-gray-900/50 transition-colors duration-300"
    >
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <p className="text-sm font-medium text-gray-400 font-body">{title}</p>
          <p className="text-3xl font-bold text-white mt-2 font-mono">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  );
};

export default StatCard;
