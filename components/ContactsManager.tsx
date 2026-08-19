'use client';

import React, { useState } from 'react';
import { useSafety } from '@/lib/safety-context';
import { Users, Plus, Trash2, Check, Phone, ShieldCheck, Send } from 'lucide-react';
import { EmergencyContact } from '@/lib/types';

export default function ContactsManager() {
  const { emergencyContacts, setEmergencyContacts, dispatchWhatsAppSOS } = useSafety();
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRelationship, setNewRelationship] = useState('');

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPhone) return;

    const newContact: EmergencyContact = {
      id: `c-${Date.now()}`,
      name: newName,
      phone: newPhone,
      relationship: newRelationship || 'Emergency Contact',
      isPrimary: emergencyContacts.length === 0,
      autoDispatch: true,
    };

    setEmergencyContacts((prev) => [...prev, newContact]);
    setNewName('');
    setNewPhone('');
    setNewRelationship('');
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    setEmergencyContacts((prev) => prev.filter((c) => c.id !== id));
  };

  const handleSetPrimary = (id: string) => {
    setEmergencyContacts((prev) =>
      prev.map((c) => ({
        ...c,
        isPrimary: c.id === id,
      }))
    );
  };

  return (
    <div className="w-full flex flex-col gap-6 pb-28 pt-20 px-4 md:px-8 max-w-container-max mx-auto animate-fadeIn select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 border-b border-white/10 pb-4">
        <div>
          <h1 className="font-mono text-xl sm:text-2xl font-bold text-on-surface flex items-center gap-2">
            <Users className="w-6 h-6 text-secondary" />
            <span>Emergency Guardian Network</span>
          </h1>
          <p className="font-mono text-xs text-on-surface-variant mt-1">
            Configure automated WhatsApp SOS recipients and rapid dial response contacts.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2 rounded-lg bg-secondary/15 hover:bg-secondary/25 text-secondary border border-secondary/30 font-mono text-xs font-bold flex items-center gap-2 transition-all active:scale-95 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Guardian Contact</span>
        </button>
      </div>

      {/* Add Contact Form */}
      {isAdding && (
        <form
          onSubmit={handleAddContact}
          className="glass-panel p-5 rounded-xl flex flex-col gap-4 border border-secondary/30 animate-fadeIn"
        >
          <h3 className="font-mono text-sm font-semibold text-secondary">New Emergency Contact</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-mono text-[11px] text-on-surface-variant mb-1">Full Name</label>
              <input
                type="text"
                placeholder="e.g. Inspector Roy / Sister"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg bg-surface-container border border-white/10 text-on-surface text-xs font-mono focus:outline-none focus:border-secondary"
              />
            </div>
            <div>
              <label className="block font-mono text-[11px] text-on-surface-variant mb-1">WhatsApp / Phone Number</label>
              <input
                type="tel"
                placeholder="+919876543210"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg bg-surface-container border border-white/10 text-on-surface text-xs font-mono focus:outline-none focus:border-secondary"
              />
            </div>
            <div>
              <label className="block font-mono text-[11px] text-on-surface-variant mb-1">Relationship / Role</label>
              <input
                type="text"
                placeholder="e.g. Police / Family / Security"
                value={newRelationship}
                onChange={(e) => setNewRelationship(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-container border border-white/10 text-on-surface text-xs font-mono focus:outline-none focus:border-secondary"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 rounded-lg bg-surface-container text-xs font-mono text-on-surface-variant hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-secondary text-on-secondary-container font-mono text-xs font-bold shadow-md hover:opacity-90"
            >
              Save Guardian
            </button>
          </div>
        </form>
      )}

      {/* Contacts List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {emergencyContacts.map((contact) => (
          <div
            key={contact.id}
            className={`glass-panel p-4 rounded-xl flex flex-col justify-between gap-4 border transition-all ${
              contact.isPrimary ? 'border-secondary/40 shadow-[0_0_15px_rgba(78,222,163,0.15)]' : 'border-white/5'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface-container-high border border-white/10 flex items-center justify-center text-secondary font-mono font-bold text-sm">
                  {contact.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-mono text-sm font-semibold text-on-surface flex items-center gap-1.5">
                    {contact.name}
                    {contact.isPrimary && (
                      <span className="px-1.5 py-0.2 rounded bg-secondary/20 text-secondary text-[9px] font-mono border border-secondary/30">
                        PRIMARY
                      </span>
                    )}
                  </h3>
                  <p className="font-mono text-xs text-on-surface-variant">{contact.relationship}</p>
                </div>
              </div>

              <button
                onClick={() => handleDelete(contact.id)}
                title="Remove contact"
                className="p-1.5 rounded hover:bg-red-500/20 text-on-surface-variant/60 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2.5 rounded-lg bg-surface-container-lowest font-mono text-xs flex justify-between items-center text-on-surface">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-secondary" />
                {contact.phone}
              </span>
              <button
                onClick={() => dispatchWhatsAppSOS(contact.phone)}
                title="Send test WhatsApp SOS alert"
                className="flex items-center gap-1 text-[11px] text-secondary hover:underline"
              >
                <Send className="w-3 h-3" />
                <span>Test Alert</span>
              </button>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-white/5">
              {!contact.isPrimary ? (
                <button
                  onClick={() => handleSetPrimary(contact.id)}
                  className="text-xs font-mono text-on-surface-variant hover:text-secondary flex items-center gap-1 transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Set as Primary Dispatch</span>
                </button>
              ) : (
                <span className="text-[11px] font-mono text-secondary flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Auto-Dispatch Enabled</span>
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
