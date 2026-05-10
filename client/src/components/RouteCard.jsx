import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, MapPin, Calendar, Clock, MessageSquare, XCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

function getStatusBadge(ride) {
  if (ride.status === 'expired') return { label: 'Expired', variant: 'secondary' };
  if (ride.status === 'full')    return { label: 'Full',    variant: 'outline' };
  const minsUntil = (new Date(ride.start_time) - Date.now()) / 60000;
  if (minsUntil > 120) return { label: 'Active',  variant: 'default' };
  if (minsUntil > 30)  return { label: 'Soon',    variant: 'warning' };
  return                        { label: 'Urgent', variant: 'destructive' };
}

function SeatDots({ total, remaining }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <div 
          key={i} 
          className={`w-2 h-2 rounded-full ${i < remaining ? 'bg-primary' : 'bg-muted'}`} 
        />
      ))}
    </div>
  );
}

export default function RouteCard({ ride, onSelect, isSelected, onBook, onCancel, onChat, alreadyBooked, isOwnRide, showBook = true, isCompleted, hideBadge, extraFooterAction, showLabels = false }) {
  const badgeInfo = getStatusBadge(ride);
  const canBook = !alreadyBooked && !isOwnRide && ride.status === 'active' && ride.seats_remaining > 0;

  const departure = new Date(ride.start_time);
  const dateStr = departure.toLocaleDateString('en-PK', { weekday: 'short', month: 'short', day: 'numeric' });
  const timeStr = departure.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });

  const ridersTaken = ride.total_seats - ride.seats_remaining;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="relative pt-3"
    >
      {!hideBadge && (
        <div className="absolute top-0 left-4 z-10">
          <Badge variant={isCompleted ? "secondary" : badgeInfo.variant} className="shadow-lg border-border">
            {isCompleted ? 'Completed' : badgeInfo.label}
          </Badge>
        </div>
      )}
      <Card 
        className={`bg-card border-border cursor-pointer transition-all ${isSelected ? 'ring-2 ring-primary border-transparent shadow-lg shadow-primary/20' : 'hover:border-border'}`}
        onClick={() => onSelect && onSelect(ride)}
      >
        <CardHeader className="pb-3 pt-6">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <CardTitle className="text-lg flex items-center gap-2 text-white">
                <span>{ride.origin_address.split(',')[0]}</span>
                <span className="text-muted-foreground">→</span>
                <span>{ride.destination_address.split(',')[0]}</span>
              </CardTitle>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pb-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-muted rounded-full">
                <User className="w-3.5 h-3.5 text-primary" />
              </div>
              {ride.poster ? (
                <Link
                  to={`/driver/${ride.poster.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary font-medium transition-colors"
                  onClick={e => e.stopPropagation()}
                >
                  {ride.poster.name}
                </Link>
              ) : 'Unknown'}
              {ride.poster?.rating?.[0] && (
                <div className="flex items-center gap-1 ml-1 text-amber-500 font-bold">
                  ⭐ {Number(ride.poster.rating[0].avg_rating).toFixed(1)}
                </div>
              )}
            </div>
            {ride.pickup_distance_km != null && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                {ride.pickup_distance_km} km
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm text-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              {dateStr}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              {timeStr}
            </div>
          </div>

          <div className="pt-2">
            {isCompleted ? (
              <div className="text-primary font-semibold text-sm">
                {ridersTaken} rider{ridersTaken !== 1 ? 's' : ''} taken
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <SeatDots total={ride.total_seats} remaining={ride.seats_remaining} />
                  <span>{ride.seats_remaining} seats left</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="pt-4 border-t border-border flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="text-lg font-bold text-white">
              PKR {Number(ride.fare_per_seat).toLocaleString()}
              <span className="text-xs text-muted-foreground font-normal ml-1">/ seat</span>
            </div>
            {extraFooterAction}
          </div>
          
          <div className="flex gap-2">
            {showBook && (
              <Button
                size="sm"
                variant={alreadyBooked ? "outline" : "default"}
                className={alreadyBooked ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20" : "bg-primary hover:bg-primary"}
                disabled={!canBook && !alreadyBooked}
                onClick={e => { e.stopPropagation(); onBook && onBook(ride); }}
              >
                {alreadyBooked ? <CheckCircle2 className="w-4 h-4 mr-1" /> : null}
                {alreadyBooked ? 'Booked' : isOwnRide ? 'Your Ride' : 'Book'}
              </Button>
            )}
            
            {(alreadyBooked || isOwnRide) && !isCompleted && onCancel && (
              <Button
                size="sm"
                variant="destructive"
                className="bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20 hover:text-red-400"
                onClick={e => { e.stopPropagation(); onCancel(ride); }}
              >
                <XCircle className="w-4 h-4 mr-1" />
                {showLabels && <span className="text-xs font-bold">{isOwnRide ? 'Cancel Trip' : 'Cancel'}</span>}
              </Button>
            )}
            
            {(alreadyBooked || isOwnRide) && !isCompleted && onChat && (
              <Button
                size="sm"
                variant="secondary"
                className="bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20 hover:text-amber-400"
                onClick={e => { e.stopPropagation(); onSelect(ride); if (typeof onChat === 'function') onChat(ride); }}
              >
                <MessageSquare className="w-4 h-4 mr-1" />
                {showLabels && <span className="text-xs font-bold">Chat</span>}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}