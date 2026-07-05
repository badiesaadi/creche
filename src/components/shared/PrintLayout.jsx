export default function PrintLayout({ children, onClose }) {
  function handlePrint() {
    window.print();
  }

  return (
    <div className="max-w-2xl space-y-5">
      {/* Toolbar — hidden on print */}
      <div className="flex items-center justify-between print:hidden">
        <button
          onClick={onClose}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Retour
        </button>
        <button
          onClick={handlePrint}
          className="px-4 py-2 rounded-md bg-teal-600 text-white text-sm font-medium hover:bg-teal-700"
        >
          Imprimer / Enregistrer PDF
        </button>
      </div>

      {/* Printable area */}
      <div
        id="print-area"
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-6"
      >
        {children}
      </div>
    </div>
  );
}