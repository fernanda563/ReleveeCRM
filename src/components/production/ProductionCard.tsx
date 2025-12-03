import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  User, 
  ChevronDown, 
  ChevronUp, 
  Search,
  ShoppingCart,
  Truck,
  Package,
  Building,
  Palette,
  Wrench,
  CheckCircle,
  Clock,
  Pencil,
  Printer,
  RefreshCw,
  Timer,
  Flame,
  Check,
  PackageSearch,
  PackageCheck,
  MapPin,
  X,
  type LucideIcon
} from "lucide-react";
import { StoneTimeline } from "./StoneTimeline";
import { MountingTimeline } from "./MountingTimeline";
import { AssignmentDialog } from "./AssignmentDialog";

const STONE_STATUSES = [
  "en_busqueda",
  "piedra_comprada",
  "piedra_transito_pobox",
  "piedra_pobox",
  "piedra_levant",
  "piedra_con_disenador",
  "piedra_en_taller",
  "piedra_montada",
];

const STONE_STATUS_LABELS: Record<string, string> = {
  "en_busqueda": "En proceso de búsqueda",
  "piedra_comprada": "Piedra comprada",
  "piedra_transito_pobox": "En tránsito a PO Box",
  "piedra_pobox": "En PO Box",
  "piedra_levant": "En Levant",
  "piedra_con_disenador": "Con diseñador",
  "piedra_en_taller": "En taller",
  "piedra_montada": "Piedra montada",
};

const STONE_STATUS_ICONS: Record<string, LucideIcon> = {
  "en_busqueda": Search,
  "piedra_comprada": ShoppingCart,
  "piedra_transito_pobox": Truck,
  "piedra_pobox": Package,
  "piedra_levant": Building,
  "piedra_con_disenador": Palette,
  "piedra_en_taller": Wrench,
  "piedra_montada": CheckCircle,
};

const MOUNTING_STATUSES = [
  "en_espera",
  "proceso_diseno",
  "impresion_modelo",
  "reimpresion_modelo",
  "traslado_modelo",
  "espera_taller",
  "proceso_vaciado",
  "pieza_terminada_taller",
  "proceso_recoleccion",
  "recolectado",
  "entregado_oyamel",
  "entregado_levant",
  "no_aplica",
];

const MOUNTING_STATUS_LABELS: Record<string, string> = {
  "en_espera": "En espera de iniciar",
  "proceso_diseno": "En proceso de diseño",
  "impresion_modelo": "Impresión de modelo",
  "reimpresion_modelo": "Reimpresión de modelo",
  "traslado_modelo": "Traslado de modelo",
  "espera_taller": "En espera en taller",
  "proceso_vaciado": "En proceso de vaciado",
  "pieza_terminada_taller": "Pieza terminada en taller",
  "proceso_recoleccion": "En proceso de recolección",
  "recolectado": "Recolectado",
  "entregado_oyamel": "Entregado en Oyamel",
  "entregado_levant": "Entregado en Levant",
  "no_aplica": "No aplica",
};

const MOUNTING_STATUS_ICONS: Record<string, LucideIcon> = {
  "en_espera": Clock,
  "proceso_diseno": Pencil,
  "impresion_modelo": Printer,
  "reimpresion_modelo": RefreshCw,
  "traslado_modelo": Truck,
  "espera_taller": Timer,
  "proceso_vaciado": Flame,
  "pieza_terminada_taller": Check,
  "proceso_recoleccion": PackageSearch,
  "recolectado": PackageCheck,
  "entregado_oyamel": MapPin,
  "entregado_levant": MapPin,
  "no_aplica": X,
};

interface ProductionOrder {
  id: string;
  custom_id?: string;
  client_id: string;
  precio_venta: number;
  metal_tipo: string;
  metal_pureza: string | null;
  piedra_tipo: string;
  estatus_piedra: string | null;
  estatus_montura: string | null;
  disenador_id: string | null;
  joyero_id: string | null;
  created_at: string;
  clients: {
    nombre: string;
    apellido: string;
    telefono_principal: string;
  };
}

interface ProductionCardProps {
  order: ProductionOrder;
  onUpdate: () => void;
}

type StepInfo = {
  label: string;
  icon: LucideIcon;
  isCurrent: boolean;
} | null;

const getThreeSteps = (
  currentStatus: string, 
  statuses: string[], 
  labels: Record<string, string>,
  icons: Record<string, LucideIcon>
) => {
  const currentIndex = statuses.indexOf(currentStatus);
  const safeIndex = currentIndex === -1 ? 0 : currentIndex;
  const totalSteps = statuses.length;
  
  let leftStep: StepInfo, centerStep: StepInfo, rightStep: StepInfo;
  
  if (safeIndex === 0) {
    // Primer paso: actual a la izquierda
    leftStep = { label: labels[statuses[0]], icon: icons[statuses[0]], isCurrent: true };
    centerStep = statuses[1] ? { label: labels[statuses[1]], icon: icons[statuses[1]], isCurrent: false } : null;
    rightStep = statuses[2] ? { label: labels[statuses[2]], icon: icons[statuses[2]], isCurrent: false } : null;
  } else if (safeIndex === totalSteps - 1) {
    // Último paso: actual a la derecha
    leftStep = statuses[safeIndex - 2] ? { label: labels[statuses[safeIndex - 2]], icon: icons[statuses[safeIndex - 2]], isCurrent: false } : null;
    centerStep = { label: labels[statuses[safeIndex - 1]], icon: icons[statuses[safeIndex - 1]], isCurrent: false };
    rightStep = { label: labels[statuses[safeIndex]], icon: icons[statuses[safeIndex]], isCurrent: true };
  } else {
    // Paso intermedio: actual al centro
    leftStep = { label: labels[statuses[safeIndex - 1]], icon: icons[statuses[safeIndex - 1]], isCurrent: false };
    centerStep = { label: labels[statuses[safeIndex]], icon: icons[statuses[safeIndex]], isCurrent: true };
    rightStep = { label: labels[statuses[safeIndex + 1]], icon: icons[statuses[safeIndex + 1]], isCurrent: false };
  }
  
  return {
    leftStep,
    centerStep,
    rightStep,
    currentIndex: safeIndex,
    totalSteps
  };
};

const StepRow = ({ 
  leftStep, 
  centerStep, 
  rightStep 
}: { 
  leftStep: StepInfo;
  centerStep: StepInfo;
  rightStep: StepInfo;
}) => (
  <div className="flex justify-between items-center text-xs mt-2 gap-1">
    {/* Paso izquierdo */}
    <div className={`flex items-center gap-1 flex-1 min-w-0 ${leftStep?.isCurrent ? 'text-primary font-medium' : 'text-muted-foreground/60'}`}>
      {leftStep && (
        <>
          <leftStep.icon className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">{leftStep.label}</span>
        </>
      )}
    </div>
    
    {/* Paso central */}
    <div className={`flex items-center gap-1 flex-1 justify-center min-w-0 ${centerStep?.isCurrent ? 'text-primary font-medium' : 'text-muted-foreground/60'}`}>
      {centerStep && (
        <>
          <centerStep.icon className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">{centerStep.label}</span>
        </>
      )}
    </div>
    
    {/* Paso derecho */}
    <div className={`flex items-center gap-1 flex-1 justify-end min-w-0 ${rightStep?.isCurrent ? 'text-primary font-medium' : 'text-muted-foreground/60'}`}>
      {rightStep && (
        <>
          <span className="truncate text-right">{rightStep.label}</span>
          <rightStep.icon className="h-3 w-3 flex-shrink-0" />
        </>
      )}
    </div>
  </div>
);

export const ProductionCard = ({ order, onUpdate }: ProductionCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const calculateProgress = (status: string | null, statuses: string[]) => {
    if (!status) return 0;
    const index = statuses.indexOf(status);
    if (index === -1) return 0;
    return ((index + 1) / statuses.length) * 100;
  };

  const stoneProgress = calculateProgress(order.estatus_piedra, STONE_STATUSES);
  const mountingProgress = calculateProgress(
    order.estatus_montura,
    MOUNTING_STATUSES.filter((s) => s !== "no_aplica")
  );

  const stoneSteps = getThreeSteps(
    order.estatus_piedra || "en_busqueda",
    STONE_STATUSES,
    STONE_STATUS_LABELS,
    STONE_STATUS_ICONS
  );

  const mountingSteps = getThreeSteps(
    order.estatus_montura || "en_espera",
    MOUNTING_STATUSES.filter((s) => s !== "no_aplica"),
    MOUNTING_STATUS_LABELS,
    MOUNTING_STATUS_ICONS
  );

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg">
                <span className="truncate">{order.clients.nombre} {order.clients.apellido}</span>
                {order.custom_id && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    {order.custom_id}
                  </span>
                )}
              </CardTitle>
              <div className="flex gap-2 mt-2 flex-wrap">
                <Badge variant="outline">
                  {order.metal_tipo.charAt(0).toUpperCase() + order.metal_tipo.slice(1)}
                  {order.metal_pureza && ` ${order.metal_pureza}`}
                </Badge>
                <Badge variant="outline">
                  {order.piedra_tipo === "diamante" ? "Diamante" : "Gema"}
                </Badge>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAssignmentDialogOpen(true)}
                className="flex-1 sm:flex-initial"
              >
                <User className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Asignar</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>

          {/* Progress Indicators */}
          <div className="space-y-4 mt-4">
            {/* Stone Progress */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Progreso Piedra</span>
                <span className="font-medium">
                  {stoneSteps.currentIndex + 1}/{stoneSteps.totalSteps} · {Math.round(stoneProgress)}%
                </span>
              </div>
              <Progress value={stoneProgress} className="h-2" />
              <StepRow 
                leftStep={stoneSteps.leftStep}
                centerStep={stoneSteps.centerStep}
                rightStep={stoneSteps.rightStep}
              />
            </div>

            {/* Mounting Progress */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Progreso Montura</span>
                <span className="font-medium">
                  {mountingSteps.currentIndex + 1}/{mountingSteps.totalSteps} · {Math.round(mountingProgress)}%
                </span>
              </div>
              <Progress value={mountingProgress} className="h-2" />
              <StepRow 
                leftStep={mountingSteps.leftStep}
                centerStep={mountingSteps.centerStep}
                rightStep={mountingSteps.rightStep}
              />
            </div>
          </div>
        </CardHeader>

        {expanded && (
          <CardContent className="space-y-6">
            {/* Info General */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">ID de Orden:</span>
                <p className="font-medium">{order.custom_id || `#${order.id.slice(0, 8)}`}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Fecha de Orden:</span>
                <p className="font-medium">{formatDate(order.created_at)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Teléfono:</span>
                <p className="font-medium">{order.clients.telefono_principal}</p>
              </div>
            </div>

            {/* Stone Timeline */}
            <div>
              <h4 className="font-semibold mb-3">Seguimiento de Piedra</h4>
              <StoneTimeline
                orderId={order.id}
                currentStatus={order.estatus_piedra || "en_busqueda"}
                onUpdate={onUpdate}
              />
            </div>

            {/* Mounting Timeline */}
            <div>
              <h4 className="font-semibold mb-3">Seguimiento de Montura</h4>
              <MountingTimeline
                orderId={order.id}
                currentStatus={order.estatus_montura || "en_espera"}
                onUpdate={onUpdate}
              />
            </div>

            {/* Assignments */}
            {(order.disenador_id || order.joyero_id) && (
              <div className="pt-4 border-t">
                <h4 className="font-semibold mb-2">Asignaciones</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  {order.disenador_id && (
                    <div>
                      <span className="text-muted-foreground">Diseñador:</span>
                      <p className="font-medium break-words">{order.disenador_id}</p>
                    </div>
                  )}
                  {order.joyero_id && (
                    <div>
                      <span className="text-muted-foreground">Joyero:</span>
                      <p className="font-medium break-words">{order.joyero_id}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      <AssignmentDialog
        open={assignmentDialogOpen}
        onOpenChange={setAssignmentDialogOpen}
        orderId={order.id}
        currentDisenadorId={order.disenador_id}
        currentJoyeroId={order.joyero_id}
        onSuccess={onUpdate}
      />
    </>
  );
};
