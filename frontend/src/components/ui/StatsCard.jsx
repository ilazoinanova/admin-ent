import Card from "./Card";

export default function StatsCard({ title, value }) {
  return (
    <Card>
      <p className="text-sm text-gray-500">{title}</p>
      <h2 className="text-2xl font-bold mt-2">{value}</h2>
    </Card>
  );
}