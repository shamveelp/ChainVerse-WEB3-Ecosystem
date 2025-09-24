import Navbar from '@/components/home/navbar';
import React from 'react';

const CommunityLayout = ({ children } : { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
    </div>
  );
};

export default CommunityLayout;
