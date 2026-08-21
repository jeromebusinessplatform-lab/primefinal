import React, { useState, useCallback } from 'react';
import { useCouriers } from '../../hooks/useCouriers';
import { storage } from '../../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Cropper, { Area } from 'react-easy-crop';

export default function CourierPage() {
  const { couriers, addCourier, removeCourier } = useCouriers();
  const [formData, setFormData] = useState({
    name: '',
    type: 'Standard' as 'Standard' | 'Express' | 'Priority',
    baseFare: 0,
    minFare: 0,
    minDistanceInclusions: 4,
    perKmCharge: 0,
    platformFeeEnabled: false,
    platformFee: 0,
    nightDifferentialEnabled: false,
    nightDifferentialFee: 0,
    surchargeEnabled: false,
    surchargeFee: 0,
  });
  const [file, setFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = () => setImageSrc(reader.result as string);
      reader.readAsDataURL(e.target.files[0]);
      setFile(e.target.files[0]);
    }
  };

  const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<Blob> => {
    const image = new Image();
    image.src = imageSrc;
    await new Promise(resolve => image.onload = resolve);
    const canvas = document.createElement('canvas');
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(
        image,
        pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
        0, 0, pixelCrop.width, pixelCrop.height
    );
    return new Promise(resolve => canvas.toBlob(blob => resolve(blob!), 'image/jpeg'));
  };

  const handleAddCourier = async () => {
    if (Object.values(formData).some(val => typeof val === 'number' && val < 0)) {
        alert("All price/fare fields must be positive numbers.");
        return;
    }
    if (!file || !croppedAreaPixels || !imageSrc) return;

    const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
    const storageRef = ref(storage, `couriers/${file.name}`);
    await uploadBytes(storageRef, croppedBlob);
    const logoUrl = await getDownloadURL(storageRef);
    
    await addCourier({
      ...formData,
      logoUrl,
      isAvailable: true,
    });
    setFormData({ name: '', type: 'Standard', baseFare: 0, minFare: 0, minDistanceInclusions: 4, perKmCharge: 0, platformFeeEnabled: false, platformFee: 0, nightDifferentialEnabled: false, nightDifferentialFee: 0, surchargeEnabled: false, surchargeFee: 0 });
    setFile(null);
    setImageSrc(null);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Courier Configuration</h1>
      <div className="bg-white p-4 rounded-xl shadow mb-6">
        <h2 className="text-lg font-medium mb-4">Add New Courier</h2>
        <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="border p-2 rounded" />
            <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})} className="border p-2 rounded">
                <option value="Standard">Standard</option>
                <option value="Express">Express</option>
                <option value="Priority">Priority</option>
            </select>
            <input type="number" placeholder="Base Fare" value={formData.baseFare} onChange={e => setFormData({...formData, baseFare: Number(e.target.value)})} className="border p-2 rounded" />
            <input type="number" placeholder="Min Fare" value={formData.minFare} onChange={e => setFormData({...formData, minFare: Number(e.target.value)})} className="border p-2 rounded" />
            <input type="number" placeholder="Min Distance Inclusions (KM)" value={formData.minDistanceInclusions} onChange={e => setFormData({...formData, minDistanceInclusions: Number(e.target.value)})} className="border p-2 rounded" />
            <input type="number" placeholder="Excess Per KM" value={formData.perKmCharge} onChange={e => setFormData({...formData, perKmCharge: Number(e.target.value)})} className="border p-2 rounded" />
            
            <div className="flex items-center gap-2">
                <input type="checkbox" checked={formData.platformFeeEnabled} onChange={e => setFormData({...formData, platformFeeEnabled: e.target.checked})} />
                <input type="number" placeholder="Platform Fee" value={formData.platformFee} onChange={e => setFormData({...formData, platformFee: Number(e.target.value)})} className="border p-2 rounded flex-1" />
            </div>
            
            <div className="flex items-center gap-2">
                <input type="checkbox" checked={formData.nightDifferentialEnabled} onChange={e => setFormData({...formData, nightDifferentialEnabled: e.target.checked})} />
                <input type="number" placeholder="Night Diff Fee" value={formData.nightDifferentialFee} onChange={e => setFormData({...formData, nightDifferentialFee: Number(e.target.value)})} className="border p-2 rounded flex-1" />
            </div>
            
            <div className="flex items-center gap-2">
                <input type="checkbox" checked={formData.surchargeEnabled} onChange={e => setFormData({...formData, surchargeEnabled: e.target.checked})} />
                <input type="number" placeholder="Surcharge Fee" value={formData.surchargeFee} onChange={e => setFormData({...formData, surchargeFee: Number(e.target.value)})} className="border p-2 rounded flex-1" />
            </div>
            
            <input type="file" onChange={handleFileChange} className="col-span-2" />
        </div>
        
        {imageSrc && (
            <div className='mt-4 h-64 w-full relative'>
                <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    onCropChange={setCrop}
                    onCropComplete={onCropComplete}
                    onZoomChange={setZoom}
                />
            </div>
        )}

        <button onClick={handleAddCourier} className="bg-black text-white px-4 py-2 rounded mt-4">Add Courier</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {couriers.map(c => (
          <div key={c.id} className="bg-white p-4 rounded-xl shadow flex items-center justify-between">
            <div className='flex items-center gap-3'>
                <img src={c.logoUrl} alt={c.name} className='w-12 h-12 object-contain'/>
                <div>
                    <div className='font-bold'>{c.name}</div>
                    <div className='text-xs text-gray-500'>{c.type}</div>
                </div>
            </div>
            <button onClick={() => removeCourier(c.id)} className="text-red-500">Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
}
