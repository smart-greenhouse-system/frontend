import { useMemo, useState } from "react";
import { Leaf, StickyNote } from "lucide-react";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";

const INITIAL_CROPS = [
  {
    id: "crop-tom-01",
    species: "Tomate Cherry",
    greenhouse: "Invernadero Norte",
    plantedAt: "2026-02-10",
    phase: "Floración",
  },
  {
    id: "crop-lech-02",
    species: "Lechuga Romana",
    greenhouse: "Invernadero Sur",
    plantedAt: "2026-03-01",
    phase: "Engorde",
  },
];

const CropManagement = () => {
  const [crops] = useState(INITIAL_CROPS);
  const [selectedId, setSelectedId] = useState(INITIAL_CROPS[0]?.id ?? "");
  const [note, setNote] = useState("");
  const [notesByCrop, setNotesByCrop] = useState({});
  const [message, setMessage] = useState("");

  const selected = useMemo(() => crops.find((c) => c.id === selectedId) || null, [crops, selectedId]);

  const handleSaveNote = (e) => {
    e.preventDefault();
    if (!selectedId || !note.trim()) {
      setMessage("Escribe una observación antes de guardar.");
      return;
    }
    setNotesByCrop((prev) => ({
      ...prev,
      [selectedId]: [...(prev[selectedId] || []), { text: note.trim(), at: new Date().toISOString() }],
    }));
    setNote("");
    setMessage("Nota agregada al cultivo seleccionado.");
  };

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-farm-green-dark">Gestión de cultivos</h1>
        <p className="mt-1 text-sm text-gray-600">
          Cultivos activos por invernadero; registro rápido de observaciones de campo.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-base font-semibold text-farm-green-dark">
            <Leaf className="h-5 w-5" aria-hidden />
            Cultivos en curso
          </h2>
          <ul className="mt-4 divide-y divide-gray-100">
            {crops.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(c.id);
                    setMessage("");
                  }}
                  className={[
                    "flex w-full flex-col items-start gap-1 rounded-xl px-3 py-3 text-left transition",
                    selectedId === c.id
                      ? "bg-farm-green-light/50 ring-2 ring-farm-green/40"
                      : "hover:bg-gray-50",
                  ].join(" ")}
                >
                  <span className="font-medium text-gray-900">{c.species}</span>
                  <span className="text-xs text-gray-600">{c.greenhouse}</span>
                  <span className="text-xs text-gray-500">
                    Siembra: {c.plantedAt} · Fase: {c.phase}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-base font-semibold text-farm-green-dark">
            <StickyNote className="h-5 w-5" aria-hidden />
            Observaciones
          </h2>
          {selected ? (
            <p className="mt-2 text-sm text-gray-600">
              {selected.species} — {selected.greenhouse}
            </p>
          ) : null}
          <form onSubmit={handleSaveNote} className="mt-4 space-y-4">
            <Input
              id="crop-note"
              name="note"
              label="Nueva nota"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej. Ajuste de riego por alta evapotranspiración"
            />
            <div className="max-w-xs">
              <Button type="submit" className="w-auto min-w-[140px]">
                Guardar nota
              </Button>
            </div>
          </form>
          {message ? (
            <p className="mt-3 text-sm text-emerald-800" role="status">
              {message}
            </p>
          ) : null}
          <ul className="mt-4 max-h-48 space-y-2 overflow-y-auto text-sm text-gray-700">
            {(notesByCrop[selectedId] || []).map((n, i) => (
              <li key={`${n.at}-${i}`} className="rounded-lg bg-gray-50 px-3 py-2">
                {n.text}
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
};

export default CropManagement;
