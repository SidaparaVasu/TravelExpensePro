import React, { useState } from 'react';
import ARCHotelForm from './ARCHotelForm';
import ARCHotelList from './ARCHotelList';

const ARCHotelMaster = () => {
  const [view, setView] = useState('list'); // 'list' or 'form'
  const [editId, setEditId] = useState(null);

  const handleEdit = (id) => {
    setEditId(id);
    setView('form');
  };

  const handleBackToList = () => {
    setView('list');
    setEditId(null);
  };

  return (
    <div>
      {view === 'list' ? (
        <ARCHotelList onEdit={handleEdit} />
      ) : (
        <ARCHotelForm editId={editId} onCancel={handleBackToList} />
      )}
    </div>
  );
};

export default ARCHotelMaster;