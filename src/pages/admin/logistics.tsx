import React, { useState } from "react";
import { useCouriers } from "@/hooks/useCouriers.ts";
import { Truck, Plus, Trash2, X, Check } from "lucide-react";
import { toast } from "sonner";

export default function LogisticsPage() {
  const { couriers, addCourier, updateCourier, removeCourier } = useCouriers();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    serviceTypes: "Same Day Express, Standard Delivery",
    baseFare: 50,
    minDistance: 5,
    minFare: 50,
    excessDistanceFare: 10,
    platformFee: 15,
    surgeFee: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    addCourier({
      name: formData.name.trim(),
      serviceTypes: formData.serviceTypes.split(",").map((s) => s.trim()).filter(Boolean),
      baseFare: Number(formData.baseFare),
      minDistance: Number(formData.minDistance),
      minFare: Number(formData.minFare),
      excessDistanceFare: Number(formData.excessDistanceFare),
      platformFee: Number(formData.platformFee),
      surgeFee: Number(formData.surgeFee),
      enabled: true,
    });

    toast.success(`Courier "${formData.name}" added successfully`);
    setShowForm(false);
    setFormData({
      name: "",
      serviceTypes: "Same Day Express, Standard Delivery",
      baseFare: 50,
      minDistance: 5,
      minFare: 50,
      excessDistanceFare: 10,
      platformFee: 15,
      surgeFee: 0,
    });
  };

  const handleToggle = (id: string, current: boolean) => {
    updateCourier(id, { enabled: !current });
    toast.success("Courier status updated");
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-black text-2xl font-normal tracking-wide uppercase"
            style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
          >
            Logistics & Couriers
          </h1>
          <p className="text-neutral-500 text-xs mt-0.5 font-normal" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            Configure active delivery fleet partners, distance pricing, and express couriers.
          </p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="bg-black hover:bg-neutral-800 text-white px-4 py-2 rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-xs font-normal"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          <Plus size={15} /> Add Delivery Partner
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <form
            onSubmit={handleSubmit}
            className="bg-white p-6 rounded-2xl w-full max-w-lg space-y-4 shadow-xl border border-neutral-200"
          >
            <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
              <h2 className="text-lg font-normal text-black uppercase" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                Add Delivery Company
              </h2>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-neutral-400 hover:text-black cursor-pointer p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 font-normal" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              <div>
                <label className="text-xs text-neutral-600 uppercase block mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Velocity Fleet Metro"
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-black"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs text-neutral-600 uppercase block mb-1">Service Types (comma-separated)</label>
                <input
                  type="text"
                  required
                  placeholder="Express, Standard, Eco Freight"
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-black"
                  value={formData.serviceTypes}
                  onChange={(e) => setFormData({ ...formData, serviceTypes: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-neutral-600 uppercase block mb-1">Base Fare ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-black"
                    value={formData.baseFare}
                    onChange={(e) => setFormData({ ...formData, baseFare: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-600 uppercase block mb-1">Min Distance (km)</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-black"
                    value={formData.minDistance}
                    onChange={(e) => setFormData({ ...formData, minDistance: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-xl text-xs text-neutral-600 hover:bg-neutral-100 cursor-pointer"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-black text-white px-5 py-2 rounded-xl text-xs cursor-pointer hover:bg-neutral-800 shadow-xs"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                Save Delivery Partner
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {couriers.length === 0 ? (
          <div className="col-span-full bg-white border border-neutral-200 rounded-2xl p-12 text-center text-neutral-400">
            <Truck size={40} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No delivery companies configured yet.</p>
          </div>
        ) : (
          couriers.map((courier) => (
            <div
              key={courier._id}
              className={`bg-white border rounded-2xl p-4 shadow-2xs space-y-3 transition-colors ${
                courier.enabled ? "border-neutral-200" : "border-neutral-200/60 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center text-black">
                    <Truck size={18} />
                  </div>
                  <div>
                    <h3
                      className="font-normal text-black text-base"
                      style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
                    >
                      {courier.name}
                    </h3>
                    <p className="text-xs text-neutral-500 font-normal" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                      {courier.serviceTypes.join(" • ")}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => removeCourier(courier._id)}
                  className="p-1 text-neutral-400 hover:text-red-600 cursor-pointer transition-colors"
                  title="Remove Courier"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div className="bg-neutral-50 rounded-xl p-3 text-xs space-y-1 text-neutral-600 border border-neutral-100 font-normal" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "13px" }}>
                <div className="flex justify-between">
                  <span>Base Rate:</span>
                  <span className="font-semibold text-black">${courier.baseFare.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Min Coverage:</span>
                  <span className="font-semibold text-black">{courier.minDistance} km</span>
                </div>
                <div className="flex justify-between">
                  <span>Excess Rate:</span>
                  <span className="font-semibold text-black">${courier.excessDistanceFare.toFixed(2)} / km</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className={`text-[11px] font-normal px-2 py-0.5 rounded-full ${courier.enabled ? "bg-green-100 text-green-800" : "bg-neutral-200 text-neutral-600"}`}>
                  {courier.enabled ? "ACTIVE COURIER" : "DISABLED"}
                </span>

                <button
                  type="button"
                  onClick={() => handleToggle(courier._id, courier.enabled)}
                  className="text-xs text-neutral-700 hover:text-black cursor-pointer font-normal border border-neutral-200 px-2.5 py-1 rounded-lg hover:bg-neutral-50"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  {courier.enabled ? "Disable" : "Enable"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
