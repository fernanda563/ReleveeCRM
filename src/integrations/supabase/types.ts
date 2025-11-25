export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      accessory_type_config: {
        Row: {
          codigo: string
          created_at: string
          id: string
          requiere_talla: boolean
          tipo_accesorio: string
        }
        Insert: {
          codigo: string
          created_at?: string
          id?: string
          requiere_talla?: boolean
          tipo_accesorio: string
        }
        Update: {
          codigo?: string
          created_at?: string
          id?: string
          requiere_talla?: boolean
          tipo_accesorio?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          client_id: string
          created_at: string
          estado: string
          fecha: string
          id: string
          notas: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          estado?: string
          fecha: string
          id?: string
          notas?: string | null
          tipo: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          estado?: string
          fecha?: string
          id?: string
          notas?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_role_access: {
        Row: {
          calendar_connection_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          calendar_connection_id: string
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          calendar_connection_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "calendar_role_access_calendar_connection_id_fkey"
            columns: ["calendar_connection_id"]
            isOneToOne: false
            referencedRelation: "google_calendar_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          apellido: string
          created_at: string
          documento_id_url: string | null
          email: string
          fuente_contacto: string | null
          id: string
          nombre: string
          numero_incremental: number
          telefono_adicional: string | null
          telefono_adicional_codigo_pais: string | null
          telefono_principal: string
          telefono_principal_codigo_pais: string | null
          updated_at: string
        }
        Insert: {
          apellido: string
          created_at?: string
          documento_id_url?: string | null
          email: string
          fuente_contacto?: string | null
          id?: string
          nombre: string
          numero_incremental?: number
          telefono_adicional?: string | null
          telefono_adicional_codigo_pais?: string | null
          telefono_principal: string
          telefono_principal_codigo_pais?: string | null
          updated_at?: string
        }
        Update: {
          apellido?: string
          created_at?: string
          documento_id_url?: string | null
          email?: string
          fuente_contacto?: string | null
          id?: string
          nombre?: string
          numero_incremental?: number
          telefono_adicional?: string | null
          telefono_adicional_codigo_pais?: string | null
          telefono_principal?: string
          telefono_principal_codigo_pais?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      google_calendar_connections: {
        Row: {
          access_token: string
          calendar_id: string
          calendar_name: string
          connected_by: string
          created_at: string
          id: string
          is_active: boolean
          refresh_token: string
          token_expires_at: string
          updated_at: string
        }
        Insert: {
          access_token: string
          calendar_id: string
          calendar_name: string
          connected_by: string
          created_at?: string
          id?: string
          is_active?: boolean
          refresh_token: string
          token_expires_at: string
          updated_at?: string
        }
        Update: {
          access_token?: string
          calendar_id?: string
          calendar_name?: string
          connected_by?: string
          created_at?: string
          id?: string
          is_active?: boolean
          refresh_token?: string
          token_expires_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      order_deletion_logs: {
        Row: {
          client_name: string | null
          created_at: string
          deleted_at: string
          deleted_by: string
          id: string
          order_custom_id: string | null
          order_data: Json
          order_id: string
        }
        Insert: {
          client_name?: string | null
          created_at?: string
          deleted_at?: string
          deleted_by: string
          id?: string
          order_custom_id?: string | null
          order_data: Json
          order_id: string
        }
        Update: {
          client_name?: string | null
          created_at?: string
          deleted_at?: string
          deleted_by?: string
          id?: string
          order_custom_id?: string | null
          order_data?: Json
          order_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          client_id: string
          comprobantes_pago: Json | null
          created_at: string
          custom_id: string | null
          diamante_claridad: string | null
          diamante_color: string | null
          diamante_corte: string | null
          diamante_forma: string | null
          diamante_quilataje: number | null
          disenador_id: string | null
          embedded_sign_url: string | null
          embedded_sign_url_expires_at: string | null
          estatus_montura: string | null
          estatus_pago: string
          estatus_piedra: string | null
          fecha_entrega_esperada: string | null
          forma_pago: string
          gema_observaciones: string | null
          id: string
          imagenes_referencia: Json | null
          importe_anticipo: number
          internal_order_id: string | null
          joyero_id: string | null
          metal_color: string | null
          metal_pureza: string | null
          metal_tipo: string
          notas: string | null
          pending_signature_pdf_url: string | null
          piedra_tipo: string
          precio_venta: number
          referencia_pago: string | null
          signature_completed_at: string | null
          signature_request_id: string | null
          signature_sent_at: string | null
          signature_status: string | null
          signed_document_url: string | null
          stl_file_id: string | null
          talla: number | null
          tipo_accesorio: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          comprobantes_pago?: Json | null
          created_at?: string
          custom_id?: string | null
          diamante_claridad?: string | null
          diamante_color?: string | null
          diamante_corte?: string | null
          diamante_forma?: string | null
          diamante_quilataje?: number | null
          disenador_id?: string | null
          embedded_sign_url?: string | null
          embedded_sign_url_expires_at?: string | null
          estatus_montura?: string | null
          estatus_pago?: string
          estatus_piedra?: string | null
          fecha_entrega_esperada?: string | null
          forma_pago: string
          gema_observaciones?: string | null
          id?: string
          imagenes_referencia?: Json | null
          importe_anticipo: number
          internal_order_id?: string | null
          joyero_id?: string | null
          metal_color?: string | null
          metal_pureza?: string | null
          metal_tipo: string
          notas?: string | null
          pending_signature_pdf_url?: string | null
          piedra_tipo: string
          precio_venta: number
          referencia_pago?: string | null
          signature_completed_at?: string | null
          signature_request_id?: string | null
          signature_sent_at?: string | null
          signature_status?: string | null
          signed_document_url?: string | null
          stl_file_id?: string | null
          talla?: number | null
          tipo_accesorio?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          comprobantes_pago?: Json | null
          created_at?: string
          custom_id?: string | null
          diamante_claridad?: string | null
          diamante_color?: string | null
          diamante_corte?: string | null
          diamante_forma?: string | null
          diamante_quilataje?: number | null
          disenador_id?: string | null
          embedded_sign_url?: string | null
          embedded_sign_url_expires_at?: string | null
          estatus_montura?: string | null
          estatus_pago?: string
          estatus_piedra?: string | null
          fecha_entrega_esperada?: string | null
          forma_pago?: string
          gema_observaciones?: string | null
          id?: string
          imagenes_referencia?: Json | null
          importe_anticipo?: number
          internal_order_id?: string | null
          joyero_id?: string | null
          metal_color?: string | null
          metal_pureza?: string | null
          metal_tipo?: string
          notas?: string | null
          pending_signature_pdf_url?: string | null
          piedra_tipo?: string
          precio_venta?: number
          referencia_pago?: string | null
          signature_completed_at?: string | null
          signature_request_id?: string | null
          signature_sent_at?: string | null
          signature_status?: string | null
          signed_document_url?: string | null
          stl_file_id?: string | null
          talla?: number | null
          tipo_accesorio?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_disenador_id_fkey"
            columns: ["disenador_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_internal_order_id_fkey"
            columns: ["internal_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders_internal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_joyero_id_fkey"
            columns: ["joyero_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_stl_file_id_fkey"
            columns: ["stl_file_id"]
            isOneToOne: false
            referencedRelation: "stl_files"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          apellido_materno: string | null
          apellido_paterno: string
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          nombre: string
          telefono: string | null
          updated_at: string
        }
        Insert: {
          apellido_materno?: string | null
          apellido_paterno: string
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          nombre: string
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          apellido_materno?: string | null
          apellido_paterno?: string
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          nombre?: string
          telefono?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      prospects: {
        Row: {
          client_id: string
          color_oro: string | null
          created_at: string
          estado: string
          estilo_anillo: string | null
          fecha_entrega_deseada: string | null
          id: string
          importe_previsto: number | null
          incluye_piedra: string | null
          largo_aprox: string | null
          metal_tipo: string | null
          observaciones: string | null
          pureza_oro: string | null
          subtipo_accesorio: string | null
          tipo_accesorio: string | null
          tipo_piedra: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          color_oro?: string | null
          created_at?: string
          estado?: string
          estilo_anillo?: string | null
          fecha_entrega_deseada?: string | null
          id?: string
          importe_previsto?: number | null
          incluye_piedra?: string | null
          largo_aprox?: string | null
          metal_tipo?: string | null
          observaciones?: string | null
          pureza_oro?: string | null
          subtipo_accesorio?: string | null
          tipo_accesorio?: string | null
          tipo_piedra?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          color_oro?: string | null
          created_at?: string
          estado?: string
          estilo_anillo?: string | null
          fecha_entrega_deseada?: string | null
          id?: string
          importe_previsto?: number | null
          incluye_piedra?: string | null
          largo_aprox?: string | null
          metal_tipo?: string | null
          observaciones?: string | null
          pureza_oro?: string | null
          subtipo_accesorio?: string | null
          tipo_accesorio?: string | null
          tipo_piedra?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prospects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders_internal: {
        Row: {
          batch_id: string | null
          cantidad: number
          certificado: string | null
          claridad: string | null
          color: string | null
          corte: string | null
          created_at: string
          created_by: string | null
          descripcion: string | null
          estatus: Database["public"]["Enums"]["internal_order_status"]
          estatus_pago: Database["public"]["Enums"]["internal_payment_status"]
          factura_pdf_url: string
          fecha_compra: string
          fecha_entrega_esperada: string | null
          forma: string | null
          id: string
          imagenes_producto: Json | null
          is_batch_primary: boolean
          medidas: string | null
          moneda: string
          notas_adicionales: string | null
          numero_factura: string
          numero_reporte: string | null
          numero_stock: string | null
          precio_compra: number
          proveedor_contacto: string | null
          proveedor_nombre: string
          pulido: string | null
          quilataje: number | null
          simetria: string | null
          supplier_id: string | null
          tipo_orden: Database["public"]["Enums"]["order_type"]
          tipo_producto: Database["public"]["Enums"]["product_type"]
          updated_at: string
        }
        Insert: {
          batch_id?: string | null
          cantidad?: number
          certificado?: string | null
          claridad?: string | null
          color?: string | null
          corte?: string | null
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          estatus?: Database["public"]["Enums"]["internal_order_status"]
          estatus_pago?: Database["public"]["Enums"]["internal_payment_status"]
          factura_pdf_url: string
          fecha_compra: string
          fecha_entrega_esperada?: string | null
          forma?: string | null
          id?: string
          imagenes_producto?: Json | null
          is_batch_primary?: boolean
          medidas?: string | null
          moneda?: string
          notas_adicionales?: string | null
          numero_factura: string
          numero_reporte?: string | null
          numero_stock?: string | null
          precio_compra: number
          proveedor_contacto?: string | null
          proveedor_nombre: string
          pulido?: string | null
          quilataje?: number | null
          simetria?: string | null
          supplier_id?: string | null
          tipo_orden?: Database["public"]["Enums"]["order_type"]
          tipo_producto: Database["public"]["Enums"]["product_type"]
          updated_at?: string
        }
        Update: {
          batch_id?: string | null
          cantidad?: number
          certificado?: string | null
          claridad?: string | null
          color?: string | null
          corte?: string | null
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          estatus?: Database["public"]["Enums"]["internal_order_status"]
          estatus_pago?: Database["public"]["Enums"]["internal_payment_status"]
          factura_pdf_url?: string
          fecha_compra?: string
          fecha_entrega_esperada?: string | null
          forma?: string | null
          id?: string
          imagenes_producto?: Json | null
          is_batch_primary?: boolean
          medidas?: string | null
          moneda?: string
          notas_adicionales?: string | null
          numero_factura?: string
          numero_reporte?: string | null
          numero_stock?: string | null
          precio_compra?: number
          proveedor_contacto?: string | null
          proveedor_nombre?: string
          pulido?: string | null
          quilataje?: number | null
          simetria?: string | null
          supplier_id?: string | null
          tipo_orden?: Database["public"]["Enums"]["order_type"]
          tipo_producto?: Database["public"]["Enums"]["product_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_internal_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      reminders: {
        Row: {
          client_id: string
          completado: boolean
          created_at: string
          descripcion: string | null
          fecha_recordatorio: string
          id: string
          prospect_id: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          client_id: string
          completado?: boolean
          created_at?: string
          descripcion?: string | null
          fecha_recordatorio: string
          id?: string
          prospect_id?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          completado?: boolean
          created_at?: string
          descripcion?: string | null
          fecha_recordatorio?: string
          id?: string
          prospect_id?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      stl_files: {
        Row: {
          created_at: string
          created_by: string | null
          descripcion: string | null
          edit_file_type: string | null
          edit_file_url: string | null
          id: string
          nombre: string
          order_id: string | null
          stl_file_url: string
          thumbnail_url: string | null
          tipo_accesorio: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          edit_file_type?: string | null
          edit_file_url?: string | null
          id?: string
          nombre: string
          order_id?: string | null
          stl_file_url: string
          thumbnail_url?: string | null
          tipo_accesorio?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          edit_file_type?: string | null
          edit_file_url?: string | null
          id?: string
          nombre?: string
          order_id?: string | null
          stl_file_url?: string
          thumbnail_url?: string | null
          tipo_accesorio?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stl_files_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          activo: boolean | null
          created_at: string | null
          email: string
          id: string
          nombre_contacto: string
          nombre_empresa: string
          notas: string | null
          pais: string | null
          telefono: string | null
          telefono_codigo_pais: string | null
          tipos_productos: Json | null
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          created_at?: string | null
          email: string
          id?: string
          nombre_contacto: string
          nombre_empresa: string
          notas?: string | null
          pais?: string | null
          telefono?: string | null
          telefono_codigo_pais?: string | null
          tipos_productos?: Json | null
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          created_at?: string | null
          email?: string
          id?: string
          nombre_contacto?: string
          nombre_empresa?: string
          notas?: string | null
          pais?: string | null
          telefono?: string | null
          telefono_codigo_pais?: string | null
          tipos_productos?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          category: string
          created_at: string | null
          id: string
          imported_themes: Json | null
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          imported_themes?: Json | null
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          imported_themes?: Json | null
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "system_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_custom_order_id: {
        Args: {
          p_client_id: string
          p_metal_color: string
          p_metal_tipo: string
          p_talla: number
          p_tipo_accesorio: string
        }
        Returns: string
      }
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "administrador"
        | "disenador"
        | "joyero"
        | "gerente_tienda"
        | "contador"
      internal_order_status:
        | "pendiente"
        | "en_transito"
        | "recibido"
        | "cancelado"
      internal_payment_status: "pendiente" | "anticipo" | "pagado"
      order_type: "externa" | "interna"
      product_type:
        | "diamante"
        | "gema"
        | "anillo"
        | "collar"
        | "arete"
        | "dije"
        | "cadena"
        | "componente"
        | "otro"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "administrador",
        "disenador",
        "joyero",
        "gerente_tienda",
        "contador",
      ],
      internal_order_status: [
        "pendiente",
        "en_transito",
        "recibido",
        "cancelado",
      ],
      internal_payment_status: ["pendiente", "anticipo", "pagado"],
      order_type: ["externa", "interna"],
      product_type: [
        "diamante",
        "gema",
        "anillo",
        "collar",
        "arete",
        "dije",
        "cadena",
        "componente",
        "otro",
      ],
    },
  },
} as const
