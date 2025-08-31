import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ShoppingCart, Home, CreditCard, Package } from "lucide-react";
import { useCart } from "../context/CartContext";
import { Button } from "./ui/button";

const Navigation = () => {
  const location = useLocation();
  const { totalItems } = useCart();

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/cart", icon: ShoppingCart, label: "Cart", badge: totalItems },
    { path: "/admin", icon: Package, label: "Admin" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                isActive
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {item.badge > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center text-[10px]">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default Navigation;
