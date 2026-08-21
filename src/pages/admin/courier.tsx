import React, { useState } from 'react';
import { useCouriers } from '../../hooks/useCouriers';
import { storage } from '../../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Courier } from '../../types/courier';

export default function CourierPage() {
  const { couriers, addCourier, updateCourier, removeCourier } = useCouriers();
  const [name, setName] = useState('');
  const [baseFare, setBaseFare] = useState(0);
  const [perKmCharge, setPerKmCharge] = useState(0);
  const [file, setFile] = useState<File | null>(null);

  const handleAddCourier = async () => {
    if (!file) return;
    const storageRef = ref(storage, `couriers/${file.name}`);
    await uploadBytes(storageRef, file);
    const logoUrl = await getDownloadURL(storageRef);
    
    await addCourier({
      name,
      logoUrl,
      baseFare,
      perKmCharge,
      platformFee: 0,
      nightDifferentialEnabled: false,
      surchargeFee: 0,
      isAvailable: true,
    });
    setName('');
    setFile(null);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Courier Configuration</h1>
      <div className="bg-white p-4 rounded-xl shadow mb-6">
        <h2 className="text-lg font-medium mb-4">Add New Courier</h2>
        <input type="text" placeholder="Name" value={name} onChange={e => setName(e.target.value)} className="border p-2 rounded mb-2 w-full" />
        <input type="number" placeholder="Base Fare" value={baseFare} onChange={e => setBaseFare(Number(e.target.value))} className="border p-2 rounded mb-2 w-full" />
        <input type="number" placeholder="Per KM" value={perKmCharge} onChange={e => setPerKmCharge(Number(e.target.value))} className="border p-2 rounded mb-2 w-full" />
        <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} className="mb-4" />
        <button onClick={handleAddCourier} className="bg-black text-white px-4 py-2 rounded">Add Courier</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {couriers.map(c => (
          <div key={c.id} className="bg-white p-4 rounded-xl shadow flex items-center justify-between">
            <div className='flex items-center gap-3'>
                <img src={c.logoUrl} alt={c.name} className='w-12 h-12 object-contain'/>
                <span>{c.name}</span>
            </div>
            <button onClick={() => removeCourier(c.id)} className="text-red-500">Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
}
