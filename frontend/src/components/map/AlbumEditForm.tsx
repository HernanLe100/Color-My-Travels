import { Button } from "../ui/button";

type EditFormState = {
  name: string;
  notes: string;
  start_date: string;
  end_date: string;
};

type AlbumEditFormProps = {
  editForm: EditFormState;
  setEditForm: React.Dispatch<React.SetStateAction<EditFormState>>;
  onCancel: () => void;
  onSave: () => void;
};

export default function AlbumEditForm({
  editForm,
  setEditForm,
  onCancel,
  onSave,
}: AlbumEditFormProps) {
  return (
    <>
      <div className="mt-4 flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-stone-500">Name</label>
          <input
            className="rounded border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-800 focus:outline-none focus:ring-1 focus:ring-stone-400"
            value={editForm.name}
            onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
          />
        </div>
        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-xs font-medium text-stone-500">Start date</label>
            <input
              type="date"
              className="rounded border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-800 focus:outline-none focus:ring-1 focus:ring-stone-400"
              value={editForm.start_date}
              onChange={(e) =>
                setEditForm((f) => ({
                  ...f,
                  start_date: e.target.value,
                }))
              }
            />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-xs font-medium text-stone-500">End date</label>
            <input
              type="date"
              className="rounded border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-800 focus:outline-none focus:ring-1 focus:ring-stone-400"
              value={editForm.end_date}
              onChange={(e) =>
                setEditForm((f) => ({
                  ...f,
                  end_date: e.target.value,
                }))
              }
            />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-stone-500">Notes</label>
          <textarea
            rows={4}
            className="rounded border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-800 focus:outline-none focus:ring-1 focus:ring-stone-400"
            value={editForm.notes}
            onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </div>
      </div>

      <div className="mt-4 flex justify-between border-t border-stone-300 pt-4">
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={onSave}>
            Save
          </Button>
        </div>
      </div>
    </>
  );
}
