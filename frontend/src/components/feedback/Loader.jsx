function Loader({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8 text-gray-600">
      <div className="h-10 w-10 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
      {text && <p className="text-sm">{text}</p>}
    </div>
  );
}

export default Loader;

