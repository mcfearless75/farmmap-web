'use client'

import { useState } from 'react'
import { Plus, MapPin, Pencil, Trash2, CheckCircle, AlertCircle, ToggleLeft, ToggleRight } from 'lucide-react'
import type { DeliveryZone } from './page'

interface Props {
  shopSlug:     string
  shopId:       string
  initialZones: DeliveryZone[]
  formatPence:  (p: number) => string
}

interface ZoneFormState {
  name:                           string
  postcode_prefixes_raw:          string
  delivery_fee_pounds:            string
  free_delivery_threshold_pounds: string
  lead_time_days:                 string
  active:                         boolean
}

const EMPTY_FORM: ZoneFormState = {
  name:                           '',
  postcode_prefixes_raw:          '',
  delivery_fee_pounds:            '',
  free_delivery_threshold_pounds: '',
  lead_time_days:                 '1',
  active:                         true,
}

function zoneToForm(z: DeliveryZone): ZoneFormState {
  return {
    name:                           z.name,
    postcode_prefixes_raw:          z.postcode_prefixes.join(', '),
    delivery_fee_pounds:            (z.delivery_fee_pence / 100).toFixed(2),
    free_delivery_threshold_pounds: z.free_delivery_threshold_pence !== null
      ? (z.free_delivery_threshold_pence / 100).toFixed(2)
      : '',
    lead_time_days:                 String(z.lead_time_days),
    active:                         z.active,
  }
}

export function ZonesClient({ shopSlug, initialZones, formatPence }: Props) {
  const [zones,       setZones]       = useState<DeliveryZone[]>(initialZones)
  const [showModal,   setShowModal]   = useState(false)
  const [editingId,   setEditingId]   = useState<string | null>(null)
  const [form,        setForm]        = useState<ZoneFormState>(EMPTY_FORM)
  const [submitting,  setSubmitting]  = useState(false)
  const [deleting,    setDeleting]    = useState<string | null>(null)
  const [msg,         setMsg]         = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  function openAdd() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setMsg(null)
    setShowModal(true)
  }

  function openEdit(zone: DeliveryZone) {
    setEditingId(zone.id)
    setForm(zoneToForm(zone))
    setMsg(null)
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditingId(null)
  }

  function buildPayload(f: ZoneFormState) {
    const prefixes = f.postcode_prefixes_raw
      .split(',')
      .map(s => s.trim().toUpperCase())
      .filter(Boolean)

    const threshold = f.free_delivery_threshold_pounds.trim()
      ? Math.round(parseFloat(f.free_delivery_threshold_pounds) * 100)
      : null

    return {
      shopSlug,
      name:                          f.name.trim(),
      postcode_prefixes:             prefixes,
      delivery_fee_pence:            Math.round(parseFloat(f.delivery_fee_pounds) * 100),
      free_delivery_threshold_pence: threshold,
      lead_time_days:                parseInt(f.lead_time_days, 10),
      active:                        f.active,
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setMsg(null)

    try {
      const payload = buildPayload(form)
      const isEdit  = editingId !== null

      const res = await fetch(isEdit ? `/api/zones/${editingId}` : '/api/zones', {
        method:  isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      })

      const json = await res.json() as { zone?: DeliveryZone; error?: string }

      if (!res.ok || !json.zone) {
        setMsg({ type: 'error', text: json.error ?? 'Failed to save zone' })
        return
      }

      if (isEdit) {
        setZones(prev => prev.map(z => z.id === editingId ? json.zone! : z))
      } else {
        setZones(prev => [...prev, json.zone!])
      }

      closeModal()
    } catch {
      setMsg({ type: 'error', text: 'Network error — please try again' })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id)

    try {
      const res = await fetch(`/api/zones/${id}`, {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ shopSlug }),
      })

      if (!res.ok) {
        const json = await res.json() as { error?: string }
        setMsg({ type: 'error', text: json.error ?? 'Failed to delete zone' })
        return
      }

      setZones(prev => prev.filter(z => z.id !== id))
    } catch {
      setMsg({ type: 'error', text: 'Network error — please try again' })
    } finally {
      setDeleting(null)
    }
  }

  async function handleToggleActive(zone: DeliveryZone) {
    try {
      const res = await fetch(`/api/zones/${zone.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ shopSlug, active: !zone.active }),
      })

      const json = await res.json() as { zone?: DeliveryZone }
      if (json.zone) {
        setZones(prev => prev.map(z => z.id === zone.id ? json.zone! : z))
      }
    } catch {
      // silent — user can retry via full edit
    }
  }

  return (
    <div>
      {/* Top-level error message */}
      {msg && !showModal && (
        <div className={`flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm mb-4 ${
          msg.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {msg.type === 'success'
            ? <CheckCircle className="w-4 h-4 shrink-0" />
            : <AlertCircle className="w-4 h-4 shrink-0" />}
          {msg.text}
        </div>
      )}

      {/* Add zone button */}
      <div className="mb-4">
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white cursor-pointer"
          style={{ background: '#15803d', fontFamily: 'var(--font-poppins)' }}
        >
          <Plus className="w-4 h-4" />
          Add zone
        </button>
      </div>

      {/* Zone cards */}
      {zones.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
          <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400 mb-3">No delivery zones yet</p>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white cursor-pointer"
            style={{ background: '#15803d', fontFamily: 'var(--font-poppins)' }}
          >
            <Plus className="w-4 h-4" />
            Add your first zone
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {zones.map(zone => (
            <div
              key={zone.id}
              className="bg-white rounded-xl border border-gray-100 px-5 py-4 flex items-start justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm text-gray-900">{zone.name}</span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={zone.active
                      ? { background: '#dcfce7', color: '#15803d' }
                      : { background: '#f3f4f6', color: '#6b7280' }}
                  >
                    {zone.active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="text-xs text-gray-500 space-y-0.5">
                  <p>
                    <span className="font-medium text-gray-600">Postcodes:</span>{' '}
                    {zone.postcode_prefixes.join(', ') || '—'}
                  </p>
                  <p>
                    <span className="font-medium text-gray-600">Delivery fee:</span>{' '}
                    {formatPence(zone.delivery_fee_pence)}
                    {zone.free_delivery_threshold_pence !== null && (
                      <span className="text-green-700 ml-1">
                        · Free over {formatPence(zone.free_delivery_threshold_pence)}
                      </span>
                    )}
                  </p>
                  <p>
                    <span className="font-medium text-gray-600">Lead time:</span>{' '}
                    {zone.lead_time_days} day{zone.lead_time_days !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleToggleActive(zone)}
                  title={zone.active ? 'Deactivate zone' : 'Activate zone'}
                  className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  {zone.active
                    ? <ToggleRight className="w-5 h-5 text-green-600" />
                    : <ToggleLeft  className="w-5 h-5" />}
                </button>

                <button
                  onClick={() => openEdit(zone)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <Pencil className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDelete(zone.id)}
                  disabled={deleting === zone.id}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Zone modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="px-6 py-5 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                {editingId ? 'Edit zone' : 'Add delivery zone'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {msg && (
                <div className="flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm bg-red-50 border border-red-200 text-red-800">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {msg.text}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Zone name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                  placeholder="e.g. Suffolk & Essex"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Postcode prefixes
                  <span className="text-gray-400 font-normal ml-1">(comma-separated, e.g. IP1, IP2, CO1)</span>
                </label>
                <input
                  type="text"
                  value={form.postcode_prefixes_raw}
                  onChange={e => setForm(f => ({ ...f, postcode_prefixes_raw: e.target.value }))}
                  placeholder="IP1, IP2, IP3, CO1"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Delivery fee (£)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.delivery_fee_pounds}
                    onChange={e => setForm(f => ({ ...f, delivery_fee_pounds: e.target.value }))}
                    required
                    placeholder="3.50"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Free delivery over (£)
                    <span className="text-gray-400 font-normal ml-1">(optional)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.free_delivery_threshold_pounds}
                    onChange={e => setForm(f => ({ ...f, free_delivery_threshold_pounds: e.target.value }))}
                    placeholder="30.00"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Lead time (days)</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form.lead_time_days}
                  onChange={e => setForm(f => ({ ...f, lead_time_days: e.target.value }))}
                  required
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-600"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold text-gray-600">Active</label>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, active: !f.active }))}
                  className="cursor-pointer"
                >
                  {form.active
                    ? <ToggleRight className="w-6 h-6 text-green-600" />
                    : <ToggleLeft  className="w-6 h-6 text-gray-400" />}
                </button>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 cursor-pointer"
                  style={{ background: '#15803d', fontFamily: 'var(--font-poppins)' }}
                >
                  {submitting ? 'Saving…' : editingId ? 'Save changes' : 'Add zone'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-700 bg-white border border-gray-200 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
