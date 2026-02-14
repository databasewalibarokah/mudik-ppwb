import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { fetchBuses, addPassenger, getAvailableSeatsCount, getOccupiedSeats, checkSeatAvailability, PREDEFINED_PASSENGER_STATUS } from '@/lib/supabase';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import BusSeatSelector from './BusSeatSelector';

interface AddPassengerFormProps {
  isOpen: boolean;
  onClose: () => void;
  periodId: string;
}

const AddPassengerForm = ({ isOpen, onClose, periodId }: AddPassengerFormProps) => {
  const [name, setName] = useState<string>('');
  const [gender, setGender] = useState<'L' | 'P'>('L');
  const [address, setAddress] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [destination, setDestination] = useState<string>('');
  const [status, setStatus] = useState<string>('pondok');
  const [groupPondok, setGroupPondok] = useState<string>('');
  // New state for umum passengers
  const [daerahPondok, setDaerahPondok] = useState<string>('');
  const [kelompok, setKelompok] = useState<string>('');
  const [mealCount, setMealCount] = useState<number>(0);
  const [mealPayment, setMealPayment] = useState<number>(0);
  const [totalPayment, setTotalPayment] = useState<number>(0);
  const [petugas, setPetugas] = useState<string>('');
  const [busId, setBusId] = useState<string>('');
  const [occupiedSeats, setOccupiedSeats] = useState<any[]>([]);
  const [selectedSeatNumber, setSelectedSeatNumber] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fetchingSeats, setFetchingSeats] = useState<boolean>(false);
  const [buses, setBuses] = useState<any[]>([]);
  const [selectedBus, setSelectedBus] = useState<any>(null);
  const [busAvailability, setBusAvailability] = useState<Record<string, number>>({});
  
  // List of petugas options
  const petugasList = [
    'Raja Faza', 'Hanif Nabila', 'Raul', 'Jibril Aksan', 'Abdurrahman', 'Bima Syafaat', 'Diaz Pambudi',
    'Zalfan Ahmad', 'Ilham Saputra', 'Muhammad Rayhan', 'Hilman Rizky', 'Muhammad Rifqi Aldiansyah',
    'Chabibulloh Dawam',
  ];
  
  const queryClient = useQueryClient();
  
  // Load buses and their availability
  useEffect(() => {
    const loadBuses = async () => {
      try {
        const busesData = await fetchBuses(periodId);
        setBuses(busesData);
        
        // Check availability for each bus
        const availability: Record<string, number> = {};
        for (const bus of busesData) {
          const availableSeats = await getAvailableSeatsCount(bus.id);
          availability[bus.id] = availableSeats;
        }
        
        setBusAvailability(availability);
      } catch (error) {
        console.error('Gagal memuat bus:', error);
        toast.error('Gagal memuat daftar bus');
      }
    };
    
    if (isOpen && periodId) {
      loadBuses();
    }
  }, [isOpen, periodId]);

  // Fetch occupied seats when bus is selected
  useEffect(() => {
    const fetchBusSeats = async () => {
      if (!busId) {
        setOccupiedSeats([]);
        setSelectedSeatNumber(null);
        setSelectedBus(null);
        setTotalPayment(0);
        return;
      }
      
      setFetchingSeats(true);
      try {
        const seats = await getOccupiedSeats(busId);
        setOccupiedSeats(seats);
        
        // Fetch and set the selected bus details
        const bus = buses.find(b => b.id === busId);
        setSelectedBus(bus);
        
        // Set default meal count based on status and bus
        if (bus) {
          if (status === 'pondok') {
            setMealCount(0);
            setMealPayment(0);
            setTotalPayment(bus.fare_per_passenger);
          } else {
            setMealCount(bus.meal_count);
            const mealCost = bus.meal_count * bus.meal_price;
            setMealPayment(mealCost);
            setTotalPayment(bus.fare_per_passenger + mealCost);
          }
        }
      } catch (error) {
        console.error('Gagal memuat kursi yang ditempati:', error);
        toast.error('Gagal memuat informasi kursi');
      } finally {
        setFetchingSeats(false);
      }
    };
    
    fetchBusSeats();
  }, [busId, buses, status]);
  
  // Update meal payment and total payment when meal count changes
  useEffect(() => {
    if (selectedBus) {
      if (status === 'pondok') {
        setMealCount(0);
        setMealPayment(0);
        setTotalPayment(selectedBus.fare_per_passenger);
      } else {
        const mealCost = mealCount * selectedBus.meal_price;
        setMealPayment(mealCost);
        setTotalPayment(selectedBus.fare_per_passenger + mealCost);
      }
    }
  }, [mealCount, status, selectedBus]);
  
  // Update groupPondok based on daerahPondok and kelompok for umum passengers
  useEffect(() => {
    if (status === 'umum') {
      const prefix = daerahPondok ? `U-${daerahPondok}` : 'U-';
      setGroupPondok(kelompok ? `${prefix}-${kelompok}` : prefix);
    }
  }, [status, daerahPondok, kelompok]);
  
  // Handle status change
  const handleStatusChange = (value: string) => {
    setStatus(value);
    
    if (value === 'pondok') {
      setMealCount(0);
      setMealPayment(0);
      setDaerahPondok('');
      setKelompok('');
      if (selectedBus) {
        setTotalPayment(selectedBus.fare_per_passenger);
      }
    } else { // umum
      if (selectedBus) {
        setMealCount(selectedBus.meal_count);
        const mealCost = selectedBus.meal_count * selectedBus.meal_price;
        setMealPayment(mealCost);
        setTotalPayment(selectedBus.fare_per_passenger + mealCost);
      }
      setGroupPondok('U-');
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSeatNumber) {
      toast.error('Silakan pilih nomor kursi');
      return;
    }
    
    if (!petugas) {
      toast.error('Silakan pilih petugas');
      return;
    }
    
    if (status === 'umum' && !phone) {
      toast.error('Nomor telepon wajib diisi untuk penumpang umum');
      return;
    }
    
    setIsLoading(true);
    
    // Check seat availability one last time before submitting
    try {
      if (selectedSeatNumber) {
        const isAvailable = await checkSeatAvailability(busId, selectedSeatNumber);
        if (!isAvailable) {
          toast.error(`Kursi nomor ${selectedSeatNumber} sudah tidak tersedia. Mohon pilih kursi lain.`);
          
          // Refresh occupied seats to show the latest state
          const seats = await getOccupiedSeats(busId);
          setOccupiedSeats(seats);
          
          // Deselect the seat
          setSelectedSeatNumber(null);
          setIsLoading(false);
          return;
        }
      }
    } catch (error) {
      console.error('Error checking seat availability:', error);
      toast.error('Gagal memeriksa ketersediaan kursi. Silakan coba lagi.');
      setIsLoading(false);
      return;
    }

    try {
      await addPassenger({
        name,
        gender,
        address,
        phone,
        destination,
        status,
        group_pondok: groupPondok,
        petugas,
        bus_seat_number: selectedSeatNumber,
        meal_count: mealCount,
        meal_payment: mealPayment,
        bus_id: busId,
        period_id: periodId,
      });
      
      toast.success('Penumpang berhasil ditambahkan');
      queryClient.invalidateQueries({ queryKey: ['passengers'] });
      queryClient.invalidateQueries({ queryKey: ['buses'] });
      resetForm();
      onClose();
    } catch (error) {
      console.error('Gagal menambahkan penumpang:', error);
      toast.error('Gagal menambahkan penumpang');
    } finally {
      setIsLoading(false);
    }
  };
  
  const resetForm = () => {
    setName('');
    setGender('L');
    setAddress('');
    setPhone('');
    setDestination('');
    setStatus('pondok');
    setGroupPondok('');
    setDaerahPondok('');
    setKelompok('');
    setMealCount(0);
    setMealPayment(0);
    setTotalPayment(0);
    setPetugas('');
    setBusId('');
    setSelectedSeatNumber(null);
    setOccupiedSeats([]);
    setSelectedBus(null);
  };

  const handleSeatSelect = (seatNumber: number) => {
    setSelectedSeatNumber(seatNumber);
  };
  
  const handleMealCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    setMealCount(value);
    if (selectedBus) {
      const mealCost = value * selectedBus.meal_price;
      setMealPayment(mealCost);
      setTotalPayment(selectedBus.fare_per_passenger + mealCost);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Tambahkan Penumpang Baru</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Lengkap</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masukkan nama lengkap"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Jenis Kelamin</Label>
            <RadioGroup value={gender} onValueChange={(value) => setGender(value as 'L' | 'P')} className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="L" id="male" />
                <Label className="font-normal" htmlFor="male">L</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="P" id="female" />
                <Label className="font-normal" htmlFor="female">P</Label>
              </div>
            </RadioGroup>
          </div>
          
          {/* Status selection */}
          <div className="space-y-2">
            <Label>Status</Label>
            <RadioGroup value={status} onValueChange={handleStatusChange} className="flex space-x-4">
              {PREDEFINED_PASSENGER_STATUS.map((s) => (
                <div key={s} className="flex items-center space-x-2">
                  <RadioGroupItem value={s} id={`status-${s}`} />
                  <Label className="font-normal" htmlFor={`status-${s}`}>{s.charAt(0).toUpperCase() + s.slice(1)}</Label>
                </div>
              ))}
             
            </RadioGroup>
            <p className='text-gray-700 text-sm'>Santri, MT dan Siswa PKKPS masuk kategori pondok.</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="address">Alamat Lengkap</Label>
            <Textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Masukkan alamat"
              required
              rows={2}
            />
          </div>
          
          {/* Phone field - required for umum */}
          <div className="space-y-2">
            <Label htmlFor="phone">
              Nomor Telepon {status === 'umum' ? <span className="text-red-500">(wajib)</span> : <span className="text-red-500">(opsional)</span>}
            </Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Masukkan nomor telepon"
              required={status === 'umum'}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="destination">Kota Tujuan</Label>
              <Input
                id="destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Masukkan kota tujuan"
                required
              />
            </div>
            
            {status === 'pondok' ? (
              <div className="space-y-2">
                <Label htmlFor="groupPondok">Kelompok Pondok</Label>
                <Input
                  id="groupPondok"
                  value={groupPondok}
                  onChange={(e) => setGroupPondok(e.target.value)}
                  placeholder="Masukkan nama kelompok"
                  required
                />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="daerahPondok">Daerah/Pondok</Label>
                  <Input
                    id="daerahPondok"
                    value={daerahPondok}
                    onChange={(e) => setDaerahPondok(e.target.value)}
                    placeholder="Masukkan daerah/pondok"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kelompok">Kelompok</Label>
                  <Input
                    id="kelompok"
                    value={kelompok}
                    onChange={(e) => setKelompok(e.target.value)}
                    placeholder="Masukkan kelompok"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="previewGroupPondok">Preview Kelompok</Label>
                  <Input
                    id="previewGroupPondok"
                    value={groupPondok}
                    disabled
                  />
                </div>
              </>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="bus">Pilih Bus</Label>
            <Select value={busId} onValueChange={(e) => {
                setBusId(busId === "none" ? "" : e)
                setSelectedSeatNumber(null);
              }} required>
              <SelectTrigger id="bus">
                <SelectValue placeholder="Pilih bus" />
              </SelectTrigger>
              <SelectContent>
                {buses.map(bus => {
                  const isAvailable = (busAvailability[bus.id] || 0) > 0;
                  return (
                    <SelectItem 
                      key={bus.id} 
                      value={bus.id}
                      disabled={!isAvailable}
                    >
                      {`${bus.destination} #${bus.bus_number}`} 
                      {isAvailable 
                        ? ` (${busAvailability[bus.id]} kursi tersedia)` 
                        : ' (PENUH)'}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {buses.length === 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                Tidak ada bus tersedia. Silakan tambahkan bus terlebih dahulu.
              </p>
            )}
          </div>
          
          {busId && (
            <div className="space-y-2 border rounded-md p-3">
              <Label className="mb-2 block">Pilih Kursi</Label>
              {fetchingSeats ? (
                <div className="text-center py-4">Memuat kursi...</div>
              ) : (
                <>
                  <BusSeatSelector
                    occupiedSeats={occupiedSeats}
                    selectedSeat={selectedSeatNumber}
                    onSeatSelect={handleSeatSelect}
                    disabled={isLoading}
                  />
                  {selectedSeatNumber && (
                    <p className="text-sm text-center mt-2">
                      Anda memilih kursi nomor: <strong>{selectedSeatNumber}</strong>
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {/* Meal count and price - only editable for umum */}
          {status === 'umum' && selectedBus && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mealCount">Jumlah Makan</Label>
                <Input
                  id="mealCount"
                  type="number"
                  min="0"
                  value={mealCount}
                  onChange={handleMealCountChange}
                  required={status === 'umum'}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="mealPayment">Biaya Makan</Label>
                <Input
                  id="mealPayment"
                  value={mealPayment.toLocaleString('id-ID')}
                  disabled
                />
                {selectedBus && (
                  <p className="text-xs text-muted-foreground">
                    Harga per porsi: Rp{selectedBus.meal_price.toLocaleString('id-ID')}
                  </p>
                )}
              </div>
            </div>
          )}
          
          {/* Total Payment Preview */}
          {selectedBus && (
            <div className="space-y-2 border-t pt-4">
              <Label htmlFor="totalPayment">Total Pembayaran</Label>
              <Input
                id="totalPayment"
                value={`Rp${totalPayment.toLocaleString('id-ID')}`}
                disabled
              />
              <p className="text-xs text-muted-foreground">
                {status === 'pondok' 
                  ? `Biaya perjalanan: Rp${selectedBus.fare_per_passenger.toLocaleString('id-ID')}`
                  : `Biaya perjalanan (Rp${selectedBus.fare_per_passenger.toLocaleString('id-ID')}) + Biaya makan (Rp${mealPayment.toLocaleString('id-ID')})`
                }
              </p>
            </div>
          )}
          
          {/* Petugas Select field */}
          <div className="space-y-2">
            <Label htmlFor="petugas">Petugas</Label>
            <Select value={petugas} onValueChange={setPetugas} required>
              <SelectTrigger id="petugas">
                <SelectValue placeholder="Pilih petugas" />
              </SelectTrigger>
              <SelectContent>
                {petugasList.map(name => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose}>
              Batal
            </Button>
            <Button 
              type="submit" 
              disabled={
                isLoading || 
                buses.length === 0 || 
                !selectedSeatNumber || 
                fetchingSeats || 
                !petugas || 
                (status === 'umum' && !phone) ||
                (status === 'umum' && (!daerahPondok || !kelompok)) ||
                isLoading
              }
            >
              {isLoading ? 'Menambahkan...' : 'Tambah Penumpang'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddPassengerForm;