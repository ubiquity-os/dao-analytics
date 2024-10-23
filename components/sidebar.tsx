export function Sidebar({ views, activeView, onChangeView }: { views: string[]; activeView: string; onChangeView: (view: string) => void }) {
  return (
    <div className="fixed left-0 top-0 h-full w-60 bg-gray-900 shadow-md flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-white">Analysis Views</h2>
      </div>
      <nav className="flex-1 overflow-y-auto">
        <ul className="space-y-2 mt-4">
          {views.map((view) => (
            <li key={view}>
              <button
                className={`w-full text-left px-6 py-3 text-gray-300 hover:bg-gray-800 transition-colors duration-200  ${
                  activeView === view ? "bg-gray-800 text-white" : ""
                }`}
                onClick={() => onChangeView(view)}
              >
                <p className="text-sm">{view}</p>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
