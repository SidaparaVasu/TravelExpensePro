export const Spinner = ({ size = "4" }: { size?: string }) => {
  return (
    <div
      className={`animate-spin rounded-full border-2 border-t-2 border-gray-200 h-${size} w-${size}`}
    ></div>
  );
};