import { Menu } from "lucide-react";
import { ICON_SRC } from "../../../components/BrandLogo";

const MobileNavbar = ({ onMenuClick }) => {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:hidden">
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-lg p-2 text-farm-green-dark transition hover:bg-farm-green-light"
        aria-label="Abrir menú"
      >
        <Menu className="h-6 w-6" />
      </button>

      <div className="flex items-center gap-2">
        <img
          src={ICON_SRC}
          alt=""
          className="h-8 w-8 rounded-lg object-cover ring-1 ring-farm-green/20"
          width={32}
          height={32}
        />
        <p className="text-sm font-semibold text-farm-green-dark">GreenHouse</p>
      </div>
    </header>
  );
};

export default MobileNavbar;
