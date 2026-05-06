import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Button } from './ui/button';
import { Car, User, LogOut, Search, PlusCircle } from 'lucide-react';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

export default function Navbar() {
  const { user, profile, signOut } = useAuthStore();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
      <Link to="/" className="flex items-center gap-2 text-xl font-bold text-white transition-colors hover:text-violet-400">
        <Car className="w-6 h-6 text-violet-500" />
        RideBoard
      </Link>

      <div className="flex items-center gap-6">
        <NavigationMenu>
          <NavigationMenuList className="hidden md:flex gap-2">
            {user && (
              <>
                <NavigationMenuItem>
                  <Link to="/find" className={navigationMenuTriggerStyle() + " bg-transparent text-slate-300 hover:text-white"}>
                    <Search className="w-4 h-4 mr-2" />
                    Find a Ride
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link to="/post" className={navigationMenuTriggerStyle() + " bg-transparent text-slate-300 hover:text-white"}>
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Post a Ride
                  </Link>
                </NavigationMenuItem>
              </>
            )}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link to="/profile">
                <Button variant="ghost" className="text-violet-400 hover:text-violet-300 hover:bg-violet-400/10">
                  <User className="w-4 h-4 mr-2" />
                  {profile?.name ? profile.name.split(' ')[0] : 'Profile'}
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={handleSignOut} className="border-slate-700 text-slate-300 hover:bg-slate-800">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white">
                Login
              </Link>
              <Link to="/register">
                <Button size="sm" className="bg-violet-600 hover:bg-violet-500 text-white">
                  Register
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
