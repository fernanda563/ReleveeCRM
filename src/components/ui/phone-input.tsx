import * as React from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Lista de códigos de país más comunes
const COUNTRY_CODES = [
  { code: "+1", country: "US/CA", flag: "🇺🇸" },
  { code: "+52", country: "MX", flag: "🇲🇽" },
  { code: "+34", country: "ES", flag: "🇪🇸" },
  { code: "+44", country: "GB", flag: "🇬🇧" },
  { code: "+33", country: "FR", flag: "🇫🇷" },
  { code: "+49", country: "DE", flag: "🇩🇪" },
  { code: "+39", country: "IT", flag: "🇮🇹" },
  { code: "+55", country: "BR", flag: "🇧🇷" },
  { code: "+54", country: "AR", flag: "🇦🇷" },
  { code: "+57", country: "CO", flag: "🇨🇴" },
  { code: "+56", country: "CL", flag: "🇨🇱" },
  { code: "+51", country: "PE", flag: "🇵🇪" },
  { code: "+58", country: "VE", flag: "🇻🇪" },
  { code: "+593", country: "EC", flag: "🇪🇨" },
  { code: "+598", country: "UY", flag: "🇺🇾" },
  { code: "+86", country: "CN", flag: "🇨🇳" },
  { code: "+81", country: "JP", flag: "🇯🇵" },
  { code: "+82", country: "KR", flag: "🇰🇷" },
  { code: "+91", country: "IN", flag: "🇮🇳" },
  { code: "+61", country: "AU", flag: "🇦🇺" },
];

// Mapa de validaciones de teléfono por código de país
const PHONE_VALIDATIONS: Record<string, { maxLength: number; name: string }> = {
  "+1": { maxLength: 10, name: "EE.UU./Canadá" },
  "+52": { maxLength: 10, name: "México" },
  "+44": { maxLength: 10, name: "Reino Unido" },
  "+33": { maxLength: 9, name: "Francia" },
  "+49": { maxLength: 11, name: "Alemania" },
  "+34": { maxLength: 9, name: "España" },
  "+39": { maxLength: 10, name: "Italia" },
  "+55": { maxLength: 11, name: "Brasil" },
  "+54": { maxLength: 10, name: "Argentina" },
  "+56": { maxLength: 9, name: "Chile" },
  "+57": { maxLength: 10, name: "Colombia" },
  "+51": { maxLength: 9, name: "Perú" },
  "+58": { maxLength: 10, name: "Venezuela" },
  "+593": { maxLength: 9, name: "Ecuador" },
  "+598": { maxLength: 9, name: "Uruguay" },
  "+86": { maxLength: 11, name: "China" },
  "+91": { maxLength: 10, name: "India" },
  "+81": { maxLength: 10, name: "Japón" },
  "+82": { maxLength: 11, name: "Corea del Sur" },
  "+61": { maxLength: 9, name: "Australia" },
};

export interface PhoneInputProps {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  defaultCountryCode?: string;
}

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value = "", onChange, disabled, placeholder, className, defaultCountryCode = "+52" }, ref) => {
    // Separar el código de país del número
    const getCountryCodeAndNumber = (fullNumber: string) => {
      if (!fullNumber) return { countryCode: defaultCountryCode, number: "" };
      
      // Buscar el código de país que coincida al inicio
      const matchedCode = COUNTRY_CODES.find(c => fullNumber.startsWith(c.code));
      if (matchedCode) {
        return {
          countryCode: matchedCode.code,
          number: fullNumber.slice(matchedCode.code.length),
        };
      }
      
      return { countryCode: defaultCountryCode, number: fullNumber };
    };

    const { countryCode: initialCode, number: initialNumber } = getCountryCodeAndNumber(value);
    const [countryCode, setCountryCode] = React.useState(initialCode);
    const [phoneNumber, setPhoneNumber] = React.useState(initialNumber);

    // Actualizar cuando cambie el valor externo
    React.useEffect(() => {
      const { countryCode: newCode, number: newNumber } = getCountryCodeAndNumber(value);
      setCountryCode(newCode);
      setPhoneNumber(newNumber);
    }, [value]);

    const handleCountryChange = (newCode: string) => {
      setCountryCode(newCode);
      const fullNumber = phoneNumber ? `${newCode}${phoneNumber}` : newCode;
      onChange?.(fullNumber);
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Solo permitir dígitos
      const newNumber = e.target.value.replace(/\D/g, '');
      
      // Obtener límite de longitud según el código de país
      const validation = PHONE_VALIDATIONS[countryCode];
      const maxLength = validation?.maxLength || 15;
      
      // Limitar según el código de país
      if (newNumber.length <= maxLength) {
        setPhoneNumber(newNumber);
        const fullNumber = newNumber ? `${countryCode}${newNumber}` : countryCode;
        onChange?.(fullNumber);
      }
    };

    return (
      <div className={cn("flex gap-2", className)}>
        <Select value={countryCode} onValueChange={handleCountryChange} disabled={disabled}>
          <SelectTrigger className="w-[110px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COUNTRY_CODES.map((country) => (
              <SelectItem key={country.code} value={country.code}>
                <span className="flex items-center gap-2">
                  <span>{country.flag}</span>
                  <span>{country.code}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          ref={ref}
          type="tel"
          value={phoneNumber}
          onChange={handlePhoneChange}
          disabled={disabled}
          placeholder={placeholder || "1234567890"}
          className="flex-1"
          maxLength={PHONE_VALIDATIONS[countryCode]?.maxLength || 15}
        />
      </div>
    );
  }
);

PhoneInput.displayName = "PhoneInput";
