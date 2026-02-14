
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Bus, updateBus } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface EditBusDialogProps {
  bus: Bus;
}

export function EditBusDialog({ bus }: EditBusDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    destination: bus.destination,
    fare_per_passenger: bus.fare_per_passenger,
    meal_count: bus.meal_count,
    meal_price: bus.meal_price,
  });
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: (updates: Partial<Bus>) => updateBus(bus.id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bus', bus.id] });
      toast({
        title: "Bus updated",
        description: "The bus details have been successfully updated.",
      });
      setOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update bus: ${error}`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'destination' ? value : Number(value)
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Edit2 className="h-4 w-4" />
          Edit Bus
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Bus Details</DialogTitle>
          <DialogDescription>
            Update the details for bus #{bus.bus_number} to {bus.destination}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="destination" className="text-right">
              Destinasi
            </Label>
            <Input
              id="destination"
              name="destination"
              value={formData.destination}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="fare_per_passenger" className="text-right">
              Tarif
            </Label>
            <Input
              id="fare_per_passenger"
              name="fare_per_passenger"
              type="number"
              value={formData.fare_per_passenger}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="meal_count" className="text-right">
              Jml Makan
            </Label>
            <Input
              id="meal_count"
              name="meal_count"
              type="number"
              value={formData.meal_count}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="meal_price" className="text-right">
              Hrg Makan
            </Label>
            <Input
              id="meal_price"
              name="meal_price"
              type="number"
              value={formData.meal_price}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
