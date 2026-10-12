import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { api } from '../../lib/api.js';

/* ---------- value helpers (form <-> API) ---------- */

const pad = (n) => String(n).padStart(2, '0');

// ISO string -> value for <input type="datetime-local"> (browser local time)
const toLocalInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const fromLocalInput = (v) => (v ? new Date(v).toISOString() : '');

const toForm = (fields, item) => {
  const form = {};
  for (const f of fields) {
    const v = item?.[f.name];
    if (f.type === 'checkbox') form[f.name] = Boolean(v);
    else if (f.type === 'list') form[f.name] = Array.isArray(v) ? v.join(', ') : '';
    else if (f.type === 'datetime') form[f.name] = toLocalInput(v);
    else if (f.type === 'select' && f.options === 'buildings') form[f.name] = v?._id || v || '';
    else form[f.name] = v ?? f.default ?? '';
  }
  return form;
};

const toPayload = (fields, form) => {
  const body = {};
  for (const f of fields) {
    const v = form[f.name];
    if (f.type === 'datetime') body[f.name] = fromLocalInput(v);
    else if (f.type === 'number') body[f.name] = v === '' ? '' : Number(v);
    else body[f.name] = v;
  }
  return body;
};

/* ---------- one form field ---------- */

function Field({ field, value, onChange, buildings }) {
  const id = `f-${field.name}`;
  const common = { id, className: 'input', value, required: field.required };

  let control;
  if (field.type === 'textarea') {
    control = <textarea {...common} rows={4} onChange={(e) => onChange(e.target.value)} />;
  } else if (field.type === 'select') {
    const opts =
      field.options === 'buildings'
        ? [{ value: '', label: '— none —' }, ...buildings.map((b) => ({ value: b._id, label: b.name }))]
        : field.options;
    control = (
      <select {...common} onChange={(e) => onChange(e.target.value)}>
        {opts.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  } else if (field.type === 'checkbox') {
    return (
      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-brand" />
        {field.label}
      </label>
    );
  } else {
    const type = { number: 'number', datetime: 'datetime-local', time: 'time' }[field.type] || 'text';
    control = (
      <input
        {...common}
        type={type}
        step={field.step}
        placeholder={field.placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {field.label}
        {field.required && <span className="text-red-600"> *</span>}
      </label>
      {control}
      {field.hint && <p className="mt-1 text-xs text-muted">{field.hint}</p>}
    </div>
  );
}

/* ---------- main component ---------- */

/**
 * Config-driven table + add/edit form for one admin resource.
 * props: endpoint ('buildings'), noun ('building'), fields, columns [{label, render(item)}], canCreate, onChanged
 */
export default function ResourceManager({ endpoint, noun, fields, columns, canCreate = true, canDelete = true, onChanged, extraActions }) {
  const [items, setItems] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null); // null | {} (new) | item
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const needsBuildings = fields.some((f) => f.options === 'buildings');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [res, b] = await Promise.all([
        api.get(`/admin/${endpoint}`),
        needsBuildings ? api.get('/admin/buildings') : Promise.resolve({ items: [] }),
      ]);
      setItems(res.items);
      setBuildings(b.items);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [endpoint, needsBuildings]);

  useEffect(() => {
    load();
  }, [load]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => JSON.stringify(it).toLowerCase().includes(q));
  }, [items, search]);

  const openForm = (item) => {
    setEditing(item);
    setForm(toForm(fields, item));
    setFormError('');
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const body = toPayload(fields, form);
      if (editing?._id) await api.patch(`/admin/${endpoint}/${editing._id}`, body);
      else await api.post(`/admin/${endpoint}`, body);
      setEditing(null);
      await load();
      onChanged?.();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item) => {
    const label = item.name || item.title || item.code || item.email || noun;
    if (!window.confirm(`Delete "${label}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/${endpoint}/${item._id}`);
      await load();
      onChanged?.();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-52 flex-1 sm:max-w-sm">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            className="input pl-10"
            placeholder={`Search ${noun}s...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label={`Search ${noun}s`}
          />
        </div>
        {canCreate && (
          <button className="btn-primary ml-auto" onClick={() => openForm({})}>
            <Plus size={16} /> Add {noun}
          </button>
        )}
      </div>

      {error && <p className="mb-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs uppercase tracking-wider text-muted">
              {columns.map((c) => (
                <th key={c.label} className="px-4 py-3 font-semibold">
                  {c.label}
                </th>
              ))}
              <th className="w-28 px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-muted">
                  Loading...
                </td>
              </tr>
            )}
            {!loading && shown.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-muted">
                  Nothing here yet.
                </td>
              </tr>
            )}
            {!loading &&
              shown.map((item) => (
                <tr key={item._id} className="border-b border-line/60 last:border-0 hover:bg-white/60">
                  {columns.map((c) => (
                    <td key={c.label} className="px-4 py-3 align-top">
                      {c.render(item)}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right align-top">
                    <div className="flex justify-end gap-1">
                      {extraActions?.(item, { setError })}
                      {fields.length > 0 && (
                        <button
                          className="rounded-lg p-2 hover:bg-black/5"
                          onClick={() => openForm(item)}
                          aria-label={`Edit ${noun}`}
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                          onClick={() => remove(item)}
                          aria-label={`Delete ${noun}`}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-[3000] flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center">
          <form onSubmit={save} className="card w-full max-w-lg space-y-4 p-5 shadow-xl" role="dialog" aria-modal="true">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold capitalize">
                {editing._id ? 'Edit' : 'Add'} {noun}
              </h2>
              <button type="button" className="rounded-lg p-1.5 hover:bg-black/5" onClick={() => setEditing(null)} aria-label="Close">
                <X size={20} />
              </button>
            </div>

            {fields.map((f) => (
              <Field
                key={f.name}
                field={f}
                value={form[f.name]}
                buildings={buildings}
                onChange={(v) => setForm((prev) => ({ ...prev, [f.name]: v }))}
              />
            ))}

            {formError && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</p>}

            <div className="flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button className="btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
