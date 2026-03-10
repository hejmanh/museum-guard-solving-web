export default function InstructionsSection() {
  return (
    <section className="mb-2 sm:mb-4 border-2 border-blue-200 bg-blue-50 rounded-lg p-3">
      <h3 className="text-sm sm:text-base font-semibold text-blue-800 mb-1 sm:mb-2">Instructions</h3>
      <ul className="text-xs sm:text-sm text-blue-800 space-y-1 list-disc list-inside">
        <li>Click two rooms to create a door</li>
        <li>Drag rooms to reposition them</li>
        <li>Drag the bottom-right corners to resize rooms</li>
        <li>Double-click a room to delete it</li>
        <li>Double-click an edge to delete a door</li>
      </ul>
    </section>
  );
}
