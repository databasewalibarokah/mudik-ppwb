
import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchBusById, fetchPassengersByBusId, Passenger } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, SearchIcon, UsersIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PassengerCard from '@/components/passenger/PassengerCard';
import { Label } from '@/components/ui/label';
import { EditBusDialog } from '@/components/bus/EditBusDialog';

const BusDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  
  // Fetch bus details
  const { data: bus, isLoading: isLoadingBus } = useQuery({
    queryKey: ['bus', id],
    queryFn: () => fetchBusById(id!),
    enabled: !!id
  });
  
  // Fetch passengers for this bus
  const { data: busPassengers = [], isLoading: isLoadingPassengers } = useQuery({
    queryKey: ['passengers', id],
    queryFn: () => fetchPassengersByBusId(id!),
    enabled: !!id
  });
  
  
  // Apply search and gender filters
  const filteredPassengers = busPassengers.filter(passenger => {
    const matchesSearch = passenger.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGender = genderFilter === 'all' || passenger.gender === genderFilter;
    return matchesSearch && matchesGender;
  });
  
  if (isLoadingBus || isLoadingPassengers) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse-light text-center">
          <p className="text-muted-foreground">Memuat data bus...</p>
        </div>
      </div>
    );
  }
  
  if (!bus) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">Bus tidak ditemukan</p>
          <Button asChild>
            <Link to="/buses">Kembali ke Daftar Bus</Link>
          </Button>
        </div>
      </div>
    );
  }

  const occupiedSeats = busPassengers.length;
  const availableSeats = bus.max_passengers - occupiedSeats;
  
  return (
    <div className="pb-28 px-8 pt-4 w-full mx-auto container">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="py-6"
      >
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="icon" asChild className="mr-2">
            <Link to="/buses">
              <ArrowLeft size={20} />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Detail Bus</h1>
        </div>
        
        {/* Bus Detail Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  #{bus.bus_number}
                </span>
                <h2 className="text-xl font-semibold">{bus.destination}</h2>
              </div>
              <EditBusDialog bus={bus} />
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Kapasitas Maksimal</span>
                <span className="font-medium">{bus.max_passengers} kursi</span>
              </div>
              
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Kursi Terpakai</span>
                <span className="font-medium">{occupiedSeats} kursi</span>
              </div>
              
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Kursi Tersedia</span>
                <span className="font-medium">{availableSeats} kursi</span>
              </div>
              
              <div className="flex justify-between pt-1">
                <span className="text-muted-foreground">Tarif Per Penumpang</span>
                <span className="font-semibold text-primary">Rp. {bus.fare_per_passenger.toLocaleString("id-ID")}</span>
              </div>

               <div className="flex justify-between pt-1">
                <span className="text-muted-foreground">Jumlah Makan</span>
                <span className="font-medium">{bus.meal_count}x</span>
              </div>

               <div className="flex justify-between pt-1">
                <span className="text-muted-foreground">Harga Makan</span>
                <span className="font-medium">Rp. {bus.meal_price.toLocaleString("id-ID")}</span>
              </div>
              
               <div className="flex justify-between pt-1 border-t mt-2">
                <span className="text-muted-foreground font-semibold">Total Harga Makan</span>
                <span className="font-bold text-primary">Rp. {(bus.meal_count * bus.meal_price).toLocaleString("id-ID")}</span>
              </div>
            </div>
            
            {/* Seat occupation progress bar */}
            <div className="mt-4 h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${availableSeats === 0 ? 'bg-gray-400' : 'bg-primary'}`}
                style={{ 
                  width: `${(occupiedSeats / bus.max_passengers) * 100}%`,
                  transition: "width 0.3s ease-out"
                }}
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Passenger List Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Daftar Penumpang</h3>
            <div className="flex items-center">
              <UsersIcon className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{busPassengers.length} Penumpang</span>
            </div>
          </div>
          
          {/* Filters */}
          <div className="mb-6 space-y-4">
            <div className="relative">
              <Label htmlFor="search-passengers" className="block text-sm font-medium text-muted-foreground mb-2">
                Cari Penumpang
              </Label>
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="search-passengers"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cari berdasarkan nama..."
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="gender-filter" className="block text-sm font-medium text-muted-foreground mb-2">
                Filter berdasarkan Jenis Kelamin
              </Label>
              <Select value={genderFilter} onValueChange={setGenderFilter}>
                <SelectTrigger id="gender-filter" className="w-full">
                  <SelectValue placeholder="Semua Jenis Kelamin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Jenis Kelamin</SelectItem>
                  <SelectItem value="L">Laki-laki</SelectItem>
                  <SelectItem value="P">Perempuan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Passenger Cards */}
          {filteredPassengers.length > 0 ? (
            <motion.div 
              className="flex flex-col space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ staggerChildren: 0.05 }}
            >
              {filteredPassengers.map(passenger => (
                <PassengerCard key={passenger.id} passenger={passenger} />
              ))}
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-8 text-center"
            >
              <p className="text-muted-foreground">Tidak ada penumpang yang ditemukan</p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default BusDetail;
