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
    <nav className="flex items-center justify-between px-6 py-4 bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
      <Link to="/" className="flex items-center gap-2 text-xl font-bold text-white transition-colors hover:text-primary">
        <Car className="w-6 h-6 text-primary" />
        RideBoard
      </Link>

      <div className="flex items-center gap-6">
        <NavigationMenu>
          <NavigationMenuList className="hidden md:flex gap-2">
            {user && (
              <>
                <NavigationMenuItem>
                  <Link to="/find" className={navigationMenuTriggerStyle() + " bg-transparent text-foreground hover:text-white"}>
                    <Search className="w-4 h-4 mr-2" />
                    Find a Ride
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link to="/post" className={navigationMenuTriggerStyle() + " bg-transparent text-foreground hover:text-white"}>
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
                <Button variant="ghost" className="text-primary hover:text-primary hover:bg-primary/10">
                  <User className="w-4 h-4 mr-2" />
                  {profile?.name ? profile.name.split(' ')[0] : 'Profile'}
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={handleSignOut} className="border-border text-foreground hover:bg-muted">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-foreground hover:text-white">
                Login
              </Link>
              <Link to="/register">
                <Button size="sm" className="bg-primary hover:bg-primary text-white">
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