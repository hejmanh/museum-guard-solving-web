export default function InstructionsSection() {
  return (
    <section className="mb-2 sm:mb-4">
      <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-1 sm:mb-2">Instructions</h3>
      <ul className="text-xs sm:text-sm text-gray-700 space-y-1 list-disc list-inside">
        <li>Drag rooms to reposition them</li>
        <li>Drag the bottom-right corners to resize rooms</li>
        <li>Double-click a room to delete it</li>
        <li>Double-click an edge to delete a door</li>
        <li>Select <strong>Genetic</strong> algorithm to configure priorities for different rooms or get multiple guard shifting solutions</li>
      </ul>
    </section>
  );
}
