// components/Layout/MenuItems.js

export const menuItems = [
  {
    title: "Dashboard",
    icon: "📊",
    path: "/dashboard",
  },
  {
    title: "Clientes",
    icon: "👥",
    children: [
      {
        title: "Listado",
        path: "/clientes",
      },
      {
        title: "Crear Cliente",
        path: "/clientes/create",
      },
    ],
  },
  {
    title: "Facturación",
    icon: "💰",
    path: "/facturacion",
  },
];