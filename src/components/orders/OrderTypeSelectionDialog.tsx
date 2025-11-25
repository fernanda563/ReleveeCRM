import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { ShoppingBag, Package } from "lucide-react";

interface OrderTypeSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectExternal: () => void;
  onSelectInternal: () => void;
}

export const OrderTypeSelectionDialog = ({
  open,
  onOpenChange,
  onSelectExternal,
  onSelectInternal,
}: OrderTypeSelectionDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Selecciona el Tipo de Orden</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4 py-4">
          <Card
            className="cursor-pointer p-6 hover:border-primary transition-colors"
            onClick={() => {
              onSelectExternal();
              onOpenChange(false);
            }}
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <ShoppingBag className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Orden de Cliente</h3>
                <p className="text-sm text-muted-foreground">
                  Pedido de fabricación de joyería para un cliente
                </p>
              </div>
            </div>
          </Card>

          <Card
            className="cursor-pointer p-6 hover:border-primary transition-colors"
            onClick={() => {
              onSelectInternal();
              onOpenChange(false);
            }}
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Package className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Compra a Proveedor</h3>
                <p className="text-sm text-muted-foreground">
                  Compra de insumos, diamantes, gemas o piezas terminadas
                </p>
              </div>
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
