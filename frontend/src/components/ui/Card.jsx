export default function Card({ children }) {
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border">
      {children}
    </div>
  );
}