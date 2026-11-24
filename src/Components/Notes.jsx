import { useState } from 'react';

import {
  Plus,
  Trash2,
  StickyNote,
  Search,
  Check,
  CalendarDays,
} from 'lucide-react';

// ============================================================
// DATE FORMAT
// ============================================================

function formatNoteDate(dateString) {
  if (!dateString) return '';

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

// ============================================================
// NOTES
// ============================================================

function Notes({
  notes = [],
  setNotes,
}) {
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState('');

  const selectedNote = notes.find(
    (note) => note.id === selectedId
  );

  // ==========================================================
  // CREATE NOTE
  // ==========================================================

  const createNote = () => {
    const timestamp = new Date().toISOString();

    const note = {
      id: crypto.randomUUID(),
      title: '',
      content: '',
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    setNotes((previous) => [
      note,
      ...previous,
    ]);

    setSelectedId(note.id);
  };

  // ==========================================================
  // UPDATE NOTE
  // ==========================================================

  const updateNote = (field, value) => {
    setNotes((previous) =>
      previous.map((note) =>
        note.id === selectedId
          ? {
              ...note,
              [field]: value,
              updatedAt: new Date().toISOString(),
            }
          : note
      )
    );
  };

  // ==========================================================
  // DELETE NOTE
  // ==========================================================

  const deleteNote = (id) => {
    if (
      !window.confirm('Delete this note?')
    ) {
      return;
    }

    setNotes((previous) =>
      previous.filter(
        (note) => note.id !== id
      )
    );

    if (selectedId === id) {
      setSelectedId(null);
    }
  };

  // ==========================================================
  // FILTER NOTES
  // ==========================================================

  const filteredNotes = notes
    .filter((note) => {
      const query = search.trim().toLowerCase();

      return (
        (note.title || '')
          .toLowerCase()
          .includes(query) ||
        (note.content || '')
          .toLowerCase()
          .includes(query)
      );
    })
    .sort(
      (a, b) =>
        new Date(b.updatedAt || 0) -
        new Date(a.updatedAt || 0)
    );

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-5 pb-8 text-[#191919]">

      {/* HEADER */}

      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#D8C4AD] pb-5">

        <div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            My Notes
            <span className="text-[#F36B21]">.</span>
          </h2>

          <p className="mt-1 text-xs text-[#857665]">
            {notes.length} saved notes
          </p>
        </div>

        <button
          type="button"
          onClick={createNote}
          className="inline-flex items-center gap-2 rounded-lg bg-[#F36B21] px-5 py-3 text-xs font-bold text-white transition-colors hover:bg-[#DC5814]"
        >
          <Plus size={17} />
          New Note
        </button>

      </div>

      {/* NOTES WORKSPACE */}

      <div className="grid gap-4 lg:grid-cols-[290px_minmax(0,1fr)]">

        {/* NOTES LIST */}

        <section className="overflow-hidden rounded-xl border border-[#D8C4AD] bg-[#FAEBD7]">

          {/* SEARCH */}

          <div className="border-b border-[#D8C4AD] p-4">

            <div className="relative">

              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#857665]"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search notes..."
                className="w-full rounded-lg border border-[#D8C4AD] bg-[#F5E4CF] py-2.5 pl-10 pr-3 text-xs text-[#191919] outline-none focus:border-[#F36B21]"
              />

            </div>
          </div>

          {/* NOTES */}

          <div className="max-h-[620px] overflow-y-auto">

            {filteredNotes.map((note) => {
              const selected =
                selectedId === note.id;

              return (
                <button
                  key={note.id}
                  type="button"
                  onClick={() =>
                    setSelectedId(note.id)
                  }
                  className={`
                    flex w-full flex-col
                    border-b border-[#D8C4AD]
                    px-4 py-4 text-left
                    transition-colors
                    last:border-b-0
                    ${
                      selected
                        ? 'border-l-[3px] border-l-[#F36B21] bg-[#F5E4CF]'
                        : 'border-l-[3px] border-l-transparent hover:bg-[#F5E4CF]'
                    }
                  `}
                >

                  <p className="w-full truncate text-sm font-semibold text-[#191919]">
                    {note.title || 'Untitled Note'}
                  </p>

                  <p className="mt-1 w-full truncate text-xs text-[#857665]">
                    {note.content || 'Empty note'}
                  </p>

                  <p className="mt-2 text-[10px] text-[#A39280]">
                    {formatNoteDate(note.updatedAt)}
                  </p>

                </button>
              );
            })}

            {!filteredNotes.length && (
              <div className="flex min-h-[200px] flex-col items-center justify-center px-5 text-center">

                <StickyNote
                  size={25}
                  className="text-[#F36B21]"
                />

                <p className="mt-3 text-xs font-semibold text-[#857665]">
                  No notes found
                </p>

              </div>
            )}

          </div>
        </section>

        {/* NOTE EDITOR */}

        <section className="flex min-h-[560px] min-w-0 flex-col rounded-xl border border-[#D8C4AD] bg-[#FAEBD7] p-5 sm:p-7">

          {selectedNote ? (
            <>

              {/* EDITOR HEADER */}

              <div className="mb-6 flex items-center justify-between border-b border-[#D8C4AD] pb-4">

                <div className="flex items-center gap-2 text-xs font-medium text-[#176D70]">
                  <Check size={15} />
                  Saved automatically
                </div>

                <button
                  type="button"
                  onClick={() =>
                    deleteNote(selectedNote.id)
                  }
                  className="rounded-md p-2 text-[#857665] hover:bg-[#C7503E]/10 hover:text-[#C7503E]"
                  aria-label="Delete note"
                >
                  <Trash2 size={18} />
                </button>

              </div>

              {/* TITLE */}

              <input
                value={selectedNote.title}
                onChange={(event) =>
                  updateNote(
                    'title',
                    event.target.value
                  )
                }
                placeholder="Note title"
                className="w-full bg-transparent text-2xl font-bold tracking-tight text-[#191919] outline-none placeholder:text-[#B5A28E]"
              />

              {/* DATE */}

              <div className="mt-4 flex items-center gap-2 text-[11px] text-[#A39280]">
                <CalendarDays size={13} />

                {formatNoteDate(
                  selectedNote.updatedAt
                )}
              </div>

              {/* DIVIDER */}

              <div className="my-5 h-px bg-[#D8C4AD]" />

              {/* CONTENT */}

              <textarea
                value={selectedNote.content}
                onChange={(event) =>
                  updateNote(
                    'content',
                    event.target.value
                  )
                }
                placeholder="Start writing..."
                className="min-h-[350px] w-full flex-1 resize-none bg-transparent text-sm leading-7 text-[#191919] outline-none placeholder:text-[#B5A28E]"
              />

            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center text-center">

              <StickyNote
                size={32}
                className="text-[#F36B21]"
              />

              <h3 className="mt-4 text-lg font-bold">
                Select a note
              </h3>

              <p className="mt-2 text-xs text-[#857665]">
                Or create a new one.
              </p>

              <button
                type="button"
                onClick={createNote}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#F36B21] px-5 py-3 text-xs font-bold text-white"
              >
                <Plus size={16} />
                Create Note
              </button>

            </div>
          )}

        </section>
      </div>
    </div>
  );
}

export default Notes;