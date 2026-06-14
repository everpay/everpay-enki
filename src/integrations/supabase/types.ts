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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          available_balance: number
          balance: number
          created_at: string
          currency: string
          id: string
          merchant_id: string
          pending_balance: number
          updated_at: string
        }
        Insert: {
          available_balance?: number
          balance?: number
          created_at?: string
          currency: string
          id?: string
          merchant_id: string
          pending_balance?: number
          updated_at?: string
        }
        Update: {
          available_balance?: number
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          merchant_id?: string
          pending_balance?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      acquirers: {
        Row: {
          active: boolean
          api_endpoint: string | null
          avg_latency_ms: number | null
          country: string | null
          created_at: string
          id: string
          name: string
          routing_weight: number | null
          success_rate: number | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          api_endpoint?: string | null
          avg_latency_ms?: number | null
          country?: string | null
          created_at?: string
          id?: string
          name: string
          routing_weight?: number | null
          success_rate?: number | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          api_endpoint?: string | null
          avg_latency_ms?: number | null
          country?: string | null
          created_at?: string
          id?: string
          name?: string
          routing_weight?: number | null
          success_rate?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      admin_notification_emails: {
        Row: {
          created_at: string | null
          email_address: string
          enabled: boolean | null
          id: string
          notify_on_chargeback: boolean | null
          notify_on_failure: boolean | null
          notify_on_high_risk: boolean | null
          notify_on_refund: boolean | null
          notify_on_success: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email_address: string
          enabled?: boolean | null
          id?: string
          notify_on_chargeback?: boolean | null
          notify_on_failure?: boolean | null
          notify_on_high_risk?: boolean | null
          notify_on_refund?: boolean | null
          notify_on_success?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email_address?: string
          enabled?: boolean | null
          id?: string
          notify_on_chargeback?: boolean | null
          notify_on_failure?: boolean | null
          notify_on_high_risk?: boolean | null
          notify_on_refund?: boolean | null
          notify_on_success?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      affiliate_links: {
        Row: {
          clicks: number
          code: string
          created_at: string
          id: string
          label: string | null
          signups: number
          user_id: string
        }
        Insert: {
          clicks?: number
          code: string
          created_at?: string
          id?: string
          label?: string | null
          signups?: number
          user_id: string
        }
        Update: {
          clicks?: number
          code?: string
          created_at?: string
          id?: string
          label?: string | null
          signups?: number
          user_id?: string
        }
        Relationships: []
      }
      affiliate_referrals: {
        Row: {
          commission_amount: number | null
          commission_rate: number
          created_at: string
          id: string
          paid_at: string | null
          referral_code: string
          referred_email: string | null
          referred_user_id: string | null
          referrer_id: string
          status: string
          updated_at: string
        }
        Insert: {
          commission_amount?: number | null
          commission_rate?: number
          created_at?: string
          id?: string
          paid_at?: string | null
          referral_code: string
          referred_email?: string | null
          referred_user_id?: string | null
          referrer_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          commission_amount?: number | null
          commission_rate?: number
          created_at?: string
          id?: string
          paid_at?: string | null
          referral_code?: string
          referred_email?: string | null
          referred_user_id?: string | null
          referrer_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      api_request_logs: {
        Row: {
          created_at: string | null
          endpoint: string | null
          id: string
          latency_ms: number | null
          merchant_id: string | null
          method: string | null
          status_code: number | null
        }
        Insert: {
          created_at?: string | null
          endpoint?: string | null
          id?: string
          latency_ms?: number | null
          merchant_id?: string | null
          method?: string | null
          status_code?: number | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string | null
          id?: string
          latency_ms?: number | null
          merchant_id?: string | null
          method?: string | null
          status_code?: number | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      balance_alert_configs: {
        Row: {
          active: boolean
          cooldown_minutes: number
          created_at: string
          currency: string
          id: string
          last_triggered_at: string | null
          merchant_id: string
          notify_email: boolean
          threshold_amount: number
          threshold_type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          cooldown_minutes?: number
          created_at?: string
          currency: string
          id?: string
          last_triggered_at?: string | null
          merchant_id: string
          notify_email?: boolean
          threshold_amount: number
          threshold_type: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          cooldown_minutes?: number
          created_at?: string
          currency?: string
          id?: string
          last_triggered_at?: string | null
          merchant_id?: string
          notify_email?: boolean
          threshold_amount?: number
          threshold_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "balance_alert_configs_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      balance_alert_history: {
        Row: {
          config_id: string | null
          currency: string
          id: string
          merchant_id: string
          notification_channel: string | null
          notification_sent: boolean
          observed_balance: number
          threshold_amount: number
          threshold_type: string
          triggered_at: string
        }
        Insert: {
          config_id?: string | null
          currency: string
          id?: string
          merchant_id: string
          notification_channel?: string | null
          notification_sent?: boolean
          observed_balance: number
          threshold_amount: number
          threshold_type: string
          triggered_at?: string
        }
        Update: {
          config_id?: string | null
          currency?: string
          id?: string
          merchant_id?: string
          notification_channel?: string | null
          notification_sent?: boolean
          observed_balance?: number
          threshold_amount?: number
          threshold_type?: string
          triggered_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "balance_alert_history_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "balance_alert_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "balance_alert_history_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_accounts: {
        Row: {
          account_number: string | null
          bank_name: string | null
          country: string | null
          created_at: string | null
          currency: string | null
          external_account_id: string | null
          iban: string | null
          id: string
          merchant_id: string | null
          provider: string | null
          sort_code: string | null
          status: string | null
        }
        Insert: {
          account_number?: string | null
          bank_name?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          external_account_id?: string | null
          iban?: string | null
          id?: string
          merchant_id?: string | null
          provider?: string | null
          sort_code?: string | null
          status?: string | null
        }
        Update: {
          account_number?: string | null
          bank_name?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          external_account_id?: string | null
          iban?: string | null
          id?: string
          merchant_id?: string | null
          provider?: string | null
          sort_code?: string | null
          status?: string | null
        }
        Relationships: []
      }
      behavioral_profiles: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          customer_id: string | null
          id: string
          merchant_id: string | null
          mouse_entropy: number | null
          session_duration: number | null
          typing_speed: number | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          merchant_id?: string | null
          mouse_entropy?: number | null
          session_duration?: number | null
          typing_speed?: number | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          merchant_id?: string | null
          mouse_entropy?: number | null
          session_duration?: number | null
          typing_speed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "behavioral_profiles_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "behavioral_profiles_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      bigcommerce_configs: {
        Row: {
          button_bg_color: string | null
          button_text: string | null
          button_text_color: string | null
          checkout_script_enabled: boolean | null
          created_at: string | null
          everpay_public_key: string | null
          everpay_secret_encrypted: string | null
          header_text: string | null
          id: string
          merchant_id: string
          store_id: string
          test_mode: boolean | null
          updated_at: string | null
        }
        Insert: {
          button_bg_color?: string | null
          button_text?: string | null
          button_text_color?: string | null
          checkout_script_enabled?: boolean | null
          created_at?: string | null
          everpay_public_key?: string | null
          everpay_secret_encrypted?: string | null
          header_text?: string | null
          id?: string
          merchant_id: string
          store_id: string
          test_mode?: boolean | null
          updated_at?: string | null
        }
        Update: {
          button_bg_color?: string | null
          button_text?: string | null
          button_text_color?: string | null
          checkout_script_enabled?: boolean | null
          created_at?: string | null
          everpay_public_key?: string | null
          everpay_secret_encrypted?: string | null
          header_text?: string | null
          id?: string
          merchant_id?: string
          store_id?: string
          test_mode?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bigcommerce_configs_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bigcommerce_configs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "bigcommerce_stores"
            referencedColumns: ["id"]
          },
        ]
      }
      bigcommerce_orders: {
        Row: {
          amount: number | null
          bc_order_id: string | null
          created_at: string | null
          currency: string | null
          id: string
          status: string | null
          store_id: string | null
          transaction_id: string | null
        }
        Insert: {
          amount?: number | null
          bc_order_id?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          status?: string | null
          store_id?: string | null
          transaction_id?: string | null
        }
        Update: {
          amount?: number | null
          bc_order_id?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          status?: string | null
          store_id?: string | null
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bigcommerce_orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "bigcommerce_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bigcommerce_orders_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      bigcommerce_stores: {
        Row: {
          access_token: string | null
          active: boolean | null
          id: string
          installed_at: string | null
          merchant_id: string | null
          refresh_token: string | null
          scope: string | null
          shop_domain: string | null
          store_hash: string
          token_updated_at: string | null
          uninstalled: boolean | null
          webhook_registered: boolean | null
        }
        Insert: {
          access_token?: string | null
          active?: boolean | null
          id?: string
          installed_at?: string | null
          merchant_id?: string | null
          refresh_token?: string | null
          scope?: string | null
          shop_domain?: string | null
          store_hash: string
          token_updated_at?: string | null
          uninstalled?: boolean | null
          webhook_registered?: boolean | null
        }
        Update: {
          access_token?: string | null
          active?: boolean | null
          id?: string
          installed_at?: string | null
          merchant_id?: string | null
          refresh_token?: string | null
          scope?: string | null
          shop_domain?: string | null
          store_hash?: string
          token_updated_at?: string | null
          uninstalled?: boolean | null
          webhook_registered?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "bigcommerce_stores_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      bigcommerce_webhook_logs: {
        Row: {
          created_at: string | null
          event_type: string | null
          id: string
          payload: Json | null
          processed: boolean | null
          source: string | null
          store_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type?: string | null
          id?: string
          payload?: Json | null
          processed?: boolean | null
          source?: string | null
          store_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string | null
          id?: string
          payload?: Json | null
          processed?: boolean | null
          source?: string | null
          store_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bigcommerce_webhook_logs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "bigcommerce_stores"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_agreements: {
        Row: {
          amount: number | null
          amount_max: number | null
          amount_min: number | null
          consent_ip: string | null
          consent_user_agent: string | null
          created_at: string
          currency: string
          current_balance: number | null
          customer_id: string | null
          deferred_charge_at: string | null
          description: string | null
          end_date: string | null
          frequency: string | null
          id: string
          interval_count: number | null
          intro_amount: number | null
          intro_periods: number | null
          merchant_id: string
          metadata: Json | null
          mit_type: string
          next_billing_at: string | null
          payment_method_id: string | null
          reload_amount: number | null
          reload_threshold: number | null
          start_date: string | null
          status: string
          total_billing_cycles: number | null
          updated_at: string
          variable_amount: boolean | null
        }
        Insert: {
          amount?: number | null
          amount_max?: number | null
          amount_min?: number | null
          consent_ip?: string | null
          consent_user_agent?: string | null
          created_at?: string
          currency?: string
          current_balance?: number | null
          customer_id?: string | null
          deferred_charge_at?: string | null
          description?: string | null
          end_date?: string | null
          frequency?: string | null
          id?: string
          interval_count?: number | null
          intro_amount?: number | null
          intro_periods?: number | null
          merchant_id: string
          metadata?: Json | null
          mit_type: string
          next_billing_at?: string | null
          payment_method_id?: string | null
          reload_amount?: number | null
          reload_threshold?: number | null
          start_date?: string | null
          status?: string
          total_billing_cycles?: number | null
          updated_at?: string
          variable_amount?: boolean | null
        }
        Update: {
          amount?: number | null
          amount_max?: number | null
          amount_min?: number | null
          consent_ip?: string | null
          consent_user_agent?: string | null
          created_at?: string
          currency?: string
          current_balance?: number | null
          customer_id?: string | null
          deferred_charge_at?: string | null
          description?: string | null
          end_date?: string | null
          frequency?: string | null
          id?: string
          interval_count?: number | null
          intro_amount?: number | null
          intro_periods?: number | null
          merchant_id?: string
          metadata?: Json | null
          mit_type?: string
          next_billing_at?: string | null
          payment_method_id?: string | null
          reload_amount?: number | null
          reload_threshold?: number | null
          start_date?: string | null
          status?: string
          total_billing_cycles?: number | null
          updated_at?: string
          variable_amount?: boolean | null
        }
        Relationships: []
      }
      billing_periods: {
        Row: {
          created_at: string
          id: string
          invoice_id: string | null
          merchant_id: string
          period_end: string
          period_start: string
          status: string
          total_everpay_fees: number
          total_fees: number
          total_processor_fees: number
          total_sponsor_fees: number
          total_transactions: number
          total_volume: number
        }
        Insert: {
          created_at?: string
          id?: string
          invoice_id?: string | null
          merchant_id: string
          period_end: string
          period_start: string
          status?: string
          total_everpay_fees?: number
          total_fees?: number
          total_processor_fees?: number
          total_sponsor_fees?: number
          total_transactions?: number
          total_volume?: number
        }
        Update: {
          created_at?: string
          id?: string
          invoice_id?: string | null
          merchant_id?: string
          period_end?: string
          period_start?: string
          status?: string
          total_everpay_fees?: number
          total_fees?: number
          total_processor_fees?: number
          total_sponsor_fees?: number
          total_transactions?: number
          total_volume?: number
        }
        Relationships: [
          {
            foreignKeyName: "billing_periods_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_periods_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      card_velocity: {
        Row: {
          created_at: string
          customer_identifier: string
          id: string
          merchant_id: string
          transaction_count: number
          transaction_date: string
        }
        Insert: {
          created_at?: string
          customer_identifier: string
          id?: string
          merchant_id: string
          transaction_count?: number
          transaction_date?: string
        }
        Update: {
          created_at?: string
          customer_identifier?: string
          id?: string
          merchant_id?: string
          transaction_count?: number
          transaction_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_velocity_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      chargeflow_notifications: {
        Row: {
          created_at: string
          event_type: string
          id: string
          merchant_id: string
          message: string | null
          payload: Json | null
          read: boolean
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          merchant_id: string
          message?: string | null
          payload?: Json | null
          read?: boolean
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          merchant_id?: string
          message?: string | null
          payload?: Json | null
          read?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "chargeflow_notifications_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      chargeflow_settings: {
        Row: {
          api_key_encrypted: string | null
          connected: boolean
          created_at: string
          id: string
          merchant_external_id: string | null
          merchant_id: string
          updated_at: string
        }
        Insert: {
          api_key_encrypted?: string | null
          connected?: boolean
          created_at?: string
          id?: string
          merchant_external_id?: string | null
          merchant_id: string
          updated_at?: string
        }
        Update: {
          api_key_encrypted?: string | null
          connected?: boolean
          created_at?: string
          id?: string
          merchant_external_id?: string | null
          merchant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chargeflow_settings_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: true
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      crypto_wallets: {
        Row: {
          address: string | null
          created_at: string | null
          currency: string | null
          id: string
          merchant_id: string | null
          network: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          merchant_id?: string | null
          network?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          merchant_id?: string | null
          network?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          billing_address: Json | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          merchant_id: string
          updated_at: string
        }
        Insert: {
          billing_address?: Json | null
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          merchant_id: string
          updated_at?: string
        }
        Update: {
          billing_address?: Json | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          merchant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      device_analytics: {
        Row: {
          browser: string | null
          browser_version: string | null
          created_at: string
          device_id: string
          device_type: string | null
          event_type: string | null
          id: string
          ip_address: string | null
          language: string | null
          merchant_id: string | null
          metadata: Json | null
          os: string | null
          os_version: string | null
          risk_factors: string[] | null
          risk_score: number | null
          screen_resolution: string | null
          timezone: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          browser?: string | null
          browser_version?: string | null
          created_at?: string
          device_id: string
          device_type?: string | null
          event_type?: string | null
          id?: string
          ip_address?: string | null
          language?: string | null
          merchant_id?: string | null
          metadata?: Json | null
          os?: string | null
          os_version?: string | null
          risk_factors?: string[] | null
          risk_score?: number | null
          screen_resolution?: string | null
          timezone?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          browser?: string | null
          browser_version?: string | null
          created_at?: string
          device_id?: string
          device_type?: string | null
          event_type?: string | null
          id?: string
          ip_address?: string | null
          language?: string | null
          merchant_id?: string | null
          metadata?: Json | null
          os?: string | null
          os_version?: string | null
          risk_factors?: string[] | null
          risk_score?: number | null
          screen_resolution?: string | null
          timezone?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_analytics_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      device_reputation: {
        Row: {
          chargebacks: number | null
          created_at: string | null
          device_fingerprint: string | null
          fraud_events: number | null
          id: string
          risk_score: number | null
        }
        Insert: {
          chargebacks?: number | null
          created_at?: string | null
          device_fingerprint?: string | null
          fraud_events?: number | null
          id?: string
          risk_score?: number | null
        }
        Update: {
          chargebacks?: number | null
          created_at?: string | null
          device_fingerprint?: string | null
          fraud_events?: number | null
          id?: string
          risk_score?: number | null
        }
        Relationships: []
      }
      disputes: {
        Row: {
          amount: number
          chargeflow_id: string | null
          chargeflow_payload: Json | null
          created_at: string
          currency: string
          customer_email: string | null
          description: string | null
          evidence_due_date: string | null
          id: string
          merchant_id: string
          outcome: string | null
          provider: string | null
          reason: string | null
          status: string
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          chargeflow_id?: string | null
          chargeflow_payload?: Json | null
          created_at?: string
          currency: string
          customer_email?: string | null
          description?: string | null
          evidence_due_date?: string | null
          id?: string
          merchant_id: string
          outcome?: string | null
          provider?: string | null
          reason?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          chargeflow_id?: string | null
          chargeflow_payload?: Json | null
          created_at?: string
          currency?: string
          customer_email?: string | null
          description?: string | null
          evidence_due_date?: string | null
          id?: string
          merchant_id?: string
          outcome?: string | null
          provider?: string | null
          reason?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      elektropay_payments: {
        Row: {
          blockchain_tx_hash: string | null
          commission_amount: number | null
          commission_rate: number | null
          created_at: string | null
          crypto_amount: number | null
          crypto_currency: string | null
          crypto_network: string | null
          customer_email: string | null
          customer_name: string | null
          elektropay_payment_id: string | null
          exchange_rate: number | null
          fiat_amount: number
          fiat_currency: string
          flat_fee: number | null
          id: string
          merchant_id: string
          metadata: Json | null
          net_amount: number | null
          paid_amount: number | null
          payment_type: string | null
          payment_url: string | null
          qrcode_url: string | null
          rate_date: string | null
          remain_amount: number | null
          status: string | null
          total_fees: number | null
          transaction_id: string | null
          updated_at: string | null
          wallet_address: string | null
        }
        Insert: {
          blockchain_tx_hash?: string | null
          commission_amount?: number | null
          commission_rate?: number | null
          created_at?: string | null
          crypto_amount?: number | null
          crypto_currency?: string | null
          crypto_network?: string | null
          customer_email?: string | null
          customer_name?: string | null
          elektropay_payment_id?: string | null
          exchange_rate?: number | null
          fiat_amount: number
          fiat_currency?: string
          flat_fee?: number | null
          id?: string
          merchant_id: string
          metadata?: Json | null
          net_amount?: number | null
          paid_amount?: number | null
          payment_type?: string | null
          payment_url?: string | null
          qrcode_url?: string | null
          rate_date?: string | null
          remain_amount?: number | null
          status?: string | null
          total_fees?: number | null
          transaction_id?: string | null
          updated_at?: string | null
          wallet_address?: string | null
        }
        Update: {
          blockchain_tx_hash?: string | null
          commission_amount?: number | null
          commission_rate?: number | null
          created_at?: string | null
          crypto_amount?: number | null
          crypto_currency?: string | null
          crypto_network?: string | null
          customer_email?: string | null
          customer_name?: string | null
          elektropay_payment_id?: string | null
          exchange_rate?: number | null
          fiat_amount?: number
          fiat_currency?: string
          flat_fee?: number | null
          id?: string
          merchant_id?: string
          metadata?: Json | null
          net_amount?: number | null
          paid_amount?: number | null
          payment_type?: string | null
          payment_url?: string | null
          qrcode_url?: string | null
          rate_date?: string | null
          remain_amount?: number | null
          status?: string | null
          total_fees?: number | null
          transaction_id?: string | null
          updated_at?: string | null
          wallet_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "elektropay_payments_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "elektropay_payments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      elektropay_settings: {
        Row: {
          commission_rate: number | null
          created_at: string | null
          default_crypto: string | null
          elektropay_store_id: string | null
          enabled: boolean | null
          enabled_assets: string[] | null
          flat_fee_usd: number | null
          id: string
          merchant_id: string
          updated_at: string | null
          us_citizen: boolean | null
          webhook_secret: string | null
        }
        Insert: {
          commission_rate?: number | null
          created_at?: string | null
          default_crypto?: string | null
          elektropay_store_id?: string | null
          enabled?: boolean | null
          enabled_assets?: string[] | null
          flat_fee_usd?: number | null
          id?: string
          merchant_id: string
          updated_at?: string | null
          us_citizen?: boolean | null
          webhook_secret?: string | null
        }
        Update: {
          commission_rate?: number | null
          created_at?: string | null
          default_crypto?: string | null
          elektropay_store_id?: string | null
          enabled?: boolean | null
          enabled_assets?: string[] | null
          flat_fee_usd?: number | null
          id?: string
          merchant_id?: string
          updated_at?: string | null
          us_citizen?: boolean | null
          webhook_secret?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "elektropay_settings_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: true
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      elektropay_wallets: {
        Row: {
          address_id: string | null
          asset_id: string
          available: number | null
          balance: number | null
          base_balance: number | null
          base_currency: string | null
          created_at: string | null
          crypto_network: string | null
          crypto_network_name: string | null
          currency: string
          dedicate_id: string | null
          elektropay_account_id: string | null
          elektropay_store_id: string | null
          id: string
          merchant_id: string
          on_hold: number | null
          status: string | null
          updated_at: string | null
          wallet_address: string | null
        }
        Insert: {
          address_id?: string | null
          asset_id: string
          available?: number | null
          balance?: number | null
          base_balance?: number | null
          base_currency?: string | null
          created_at?: string | null
          crypto_network?: string | null
          crypto_network_name?: string | null
          currency: string
          dedicate_id?: string | null
          elektropay_account_id?: string | null
          elektropay_store_id?: string | null
          id?: string
          merchant_id: string
          on_hold?: number | null
          status?: string | null
          updated_at?: string | null
          wallet_address?: string | null
        }
        Update: {
          address_id?: string | null
          asset_id?: string
          available?: number | null
          balance?: number | null
          base_balance?: number | null
          base_currency?: string | null
          created_at?: string | null
          crypto_network?: string | null
          crypto_network_name?: string | null
          currency?: string
          dedicate_id?: string | null
          elektropay_account_id?: string | null
          elektropay_store_id?: string | null
          id?: string
          merchant_id?: string
          on_hold?: number | null
          status?: string | null
          updated_at?: string | null
          wallet_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "elektropay_wallets_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      elektropay_withdrawals: {
        Row: {
          amount: number
          asset_id: string
          blockchain_tx_hash: string | null
          created_at: string | null
          crypto_network: string | null
          description: string | null
          destination_address: string
          elektropay_withdraw_id: string | null
          fee: number | null
          fee_asset_id: string | null
          id: string
          merchant_id: string
          metadata: Json | null
          status: string | null
          updated_at: string | null
          withdraw_asset_id: string | null
        }
        Insert: {
          amount: number
          asset_id: string
          blockchain_tx_hash?: string | null
          created_at?: string | null
          crypto_network?: string | null
          description?: string | null
          destination_address: string
          elektropay_withdraw_id?: string | null
          fee?: number | null
          fee_asset_id?: string | null
          id?: string
          merchant_id: string
          metadata?: Json | null
          status?: string | null
          updated_at?: string | null
          withdraw_asset_id?: string | null
        }
        Update: {
          amount?: number
          asset_id?: string
          blockchain_tx_hash?: string | null
          created_at?: string | null
          crypto_network?: string | null
          description?: string | null
          destination_address?: string
          elektropay_withdraw_id?: string | null
          fee?: number | null
          fee_asset_id?: string | null
          id?: string
          merchant_id?: string
          metadata?: Json | null
          status?: string | null
          updated_at?: string | null
          withdraw_asset_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "elektropay_withdrawals_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      event_logs: {
        Row: {
          created_at: string | null
          event_type: string | null
          id: string
          payload: Json | null
          source_service: string | null
        }
        Insert: {
          created_at?: string | null
          event_type?: string | null
          id?: string
          payload?: Json | null
          source_service?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string | null
          id?: string
          payload?: Json | null
          source_service?: string | null
        }
        Relationships: []
      }
      everpay_webhooks: {
        Row: {
          created_at: string | null
          id: string
          payload: Json | null
          processed: boolean | null
          status: string | null
          transaction_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          payload?: Json | null
          processed?: boolean | null
          status?: string | null
          transaction_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          payload?: Json | null
          processed?: boolean | null
          status?: string | null
          transaction_id?: string | null
        }
        Relationships: []
      }
      failover_configs: {
        Row: {
          active: boolean
          backoff: string
          created_at: string
          fallback_chain: Json
          id: string
          max_retries: number
          merchant_id: string | null
          processor: string
          retry_delay_ms: number
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          active?: boolean
          backoff?: string
          created_at?: string
          fallback_chain?: Json
          id?: string
          max_retries?: number
          merchant_id?: string | null
          processor: string
          retry_delay_ms?: number
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          active?: boolean
          backoff?: string
          created_at?: string
          fallback_chain?: Json
          id?: string
          max_retries?: number
          merchant_id?: string | null
          processor?: string
          retry_delay_ms?: number
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: []
      }
      fee_breakdowns: {
        Row: {
          created_at: string
          everpay_fee: number
          id: string
          merchant_id: string
          net_amount: number
          pricing_model: string | null
          pricing_snapshot: Json | null
          processor_fee: number
          sponsor_fee: number
          total_fee: number
          transaction_amount: number
          transaction_id: string
        }
        Insert: {
          created_at?: string
          everpay_fee?: number
          id?: string
          merchant_id: string
          net_amount?: number
          pricing_model?: string | null
          pricing_snapshot?: Json | null
          processor_fee?: number
          sponsor_fee?: number
          total_fee?: number
          transaction_amount?: number
          transaction_id: string
        }
        Update: {
          created_at?: string
          everpay_fee?: number
          id?: string
          merchant_id?: string
          net_amount?: number
          pricing_model?: string | null
          pricing_snapshot?: Json | null
          processor_fee?: number
          sponsor_fee?: number
          total_fee?: number
          transaction_amount?: number
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_breakdowns_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_breakdowns_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: true
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      fraud_graph_edges: {
        Row: {
          created_at: string | null
          id: string
          relationship_type: string | null
          source_node: string | null
          target_node: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          relationship_type?: string | null
          source_node?: string | null
          target_node?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          relationship_type?: string | null
          source_node?: string | null
          target_node?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fraud_graph_edges_source_node_fkey"
            columns: ["source_node"]
            isOneToOne: false
            referencedRelation: "fraud_graph_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fraud_graph_edges_target_node_fkey"
            columns: ["target_node"]
            isOneToOne: false
            referencedRelation: "fraud_graph_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      fraud_graph_nodes: {
        Row: {
          created_at: string | null
          id: string
          node_type: string | null
          node_value: string | null
          risk_score: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          node_type?: string | null
          node_value?: string | null
          risk_score?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          node_type?: string | null
          node_value?: string | null
          risk_score?: number | null
        }
        Relationships: []
      }
      fraud_scores: {
        Row: {
          action_taken: string | null
          card_bin: string | null
          created_at: string
          customer_email: string | null
          device_fingerprint: string | null
          device_score: number | null
          geo_score: number | null
          id: string
          ip_address: string | null
          merchant_id: string
          metadata: Json | null
          risk_factors: string[] | null
          risk_level: string | null
          total_score: number | null
          transaction_id: string | null
          velocity_score: number | null
        }
        Insert: {
          action_taken?: string | null
          card_bin?: string | null
          created_at?: string
          customer_email?: string | null
          device_fingerprint?: string | null
          device_score?: number | null
          geo_score?: number | null
          id?: string
          ip_address?: string | null
          merchant_id: string
          metadata?: Json | null
          risk_factors?: string[] | null
          risk_level?: string | null
          total_score?: number | null
          transaction_id?: string | null
          velocity_score?: number | null
        }
        Update: {
          action_taken?: string | null
          card_bin?: string | null
          created_at?: string
          customer_email?: string | null
          device_fingerprint?: string | null
          device_score?: number | null
          geo_score?: number | null
          id?: string
          ip_address?: string | null
          merchant_id?: string
          metadata?: Json | null
          risk_factors?: string[] | null
          risk_level?: string | null
          total_score?: number | null
          transaction_id?: string | null
          velocity_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fraud_scores_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fraud_scores_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      fx_rates: {
        Row: {
          applied_rate: number | null
          base_currency: string
          created_at: string
          id: string
          mid_market_rate: number | null
          quote_currency: string
          rate: number
          source: string | null
          spread_bps: number | null
        }
        Insert: {
          applied_rate?: number | null
          base_currency: string
          created_at?: string
          id?: string
          mid_market_rate?: number | null
          quote_currency: string
          rate: number
          source?: string | null
          spread_bps?: number | null
        }
        Update: {
          applied_rate?: number | null
          base_currency?: string
          created_at?: string
          id?: string
          mid_market_rate?: number | null
          quote_currency?: string
          rate?: number
          source?: string | null
          spread_bps?: number | null
        }
        Relationships: []
      }
      fx_revenue_logs: {
        Row: {
          amount: number
          applied_rate: number
          base_currency: string
          created_at: string
          id: string
          merchant_id: string
          mid_market_rate: number
          quote_currency: string
          revenue_amount: number
          spread_bps: number
          transaction_id: string | null
        }
        Insert: {
          amount?: number
          applied_rate: number
          base_currency: string
          created_at?: string
          id?: string
          merchant_id: string
          mid_market_rate: number
          quote_currency: string
          revenue_amount?: number
          spread_bps?: number
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          applied_rate?: number
          base_currency?: string
          created_at?: string
          id?: string
          merchant_id?: string
          mid_market_rate?: number
          quote_currency?: string
          revenue_amount?: number
          spread_bps?: number
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fx_revenue_logs_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fx_revenue_logs_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      gateway_credentials: {
        Row: {
          created_at: string
          credentials: Json
          environment: string
          gateway_name: string
          gateway_type: string
          id: string
          is_active: boolean
          label: string | null
          merchant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          credentials?: Json
          environment?: string
          gateway_name: string
          gateway_type?: string
          id?: string
          is_active?: boolean
          label?: string | null
          merchant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          credentials?: Json
          environment?: string
          gateway_name?: string
          gateway_type?: string
          id?: string
          is_active?: boolean
          label?: string | null
          merchant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gateway_credentials_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      iban_accounts: {
        Row: {
          bank_name: string | null
          bic: string | null
          country: string | null
          created_at: string | null
          iban: string | null
          id: string
          merchant_id: string | null
          status: string | null
        }
        Insert: {
          bank_name?: string | null
          bic?: string | null
          country?: string | null
          created_at?: string | null
          iban?: string | null
          id?: string
          merchant_id?: string | null
          status?: string | null
        }
        Update: {
          bank_name?: string | null
          bic?: string | null
          country?: string | null
          created_at?: string | null
          iban?: string | null
          id?: string
          merchant_id?: string | null
          status?: string | null
        }
        Relationships: []
      }
      idempotency_keys: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          key: string
          merchant_id: string
          response: Json | null
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          key: string
          merchant_id: string
          response?: Json | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          key?: string
          merchant_id?: string
          response?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "idempotency_keys_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          created_at: string
          currency: string
          customer_email: string
          customer_name: string | null
          description: string | null
          due_date: string | null
          id: string
          invoice_number: string | null
          items: Json | null
          merchant_id: string
          notes: string | null
          paid_at: string | null
          status: string
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          customer_email: string
          customer_name?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          items?: Json | null
          merchant_id: string
          notes?: string | null
          paid_at?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          customer_email?: string
          customer_name?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          items?: Json | null
          merchant_id?: string
          notes?: string | null
          paid_at?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      itspaid_cards: {
        Row: {
          balance: number
          card_account_id: string | null
          card_expiration: string | null
          card_last4: string | null
          created_at: string
          currency: string
          environment: string
          id: string
          initial_load: number
          itspaid_transaction_id: string | null
          merchant_id: string
          raw_response: Json | null
          recipient_account_id: string | null
          recipient_email: string
          recipient_full_name: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          card_account_id?: string | null
          card_expiration?: string | null
          card_last4?: string | null
          created_at?: string
          currency?: string
          environment?: string
          id?: string
          initial_load?: number
          itspaid_transaction_id?: string | null
          merchant_id: string
          raw_response?: Json | null
          recipient_account_id?: string | null
          recipient_email: string
          recipient_full_name: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          card_account_id?: string | null
          card_expiration?: string | null
          card_last4?: string | null
          created_at?: string
          currency?: string
          environment?: string
          id?: string
          initial_load?: number
          itspaid_transaction_id?: string | null
          merchant_id?: string
          raw_response?: Json | null
          recipient_account_id?: string | null
          recipient_email?: string
          recipient_full_name?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "itspaid_cards_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      itspaid_settings: {
        Row: {
          created_at: string
          default_notification_type: number
          default_send_method: string
          enabled: boolean
          environment: string
          id: string
          merchant_id: string
          updated_at: string
          webhook_url: string | null
        }
        Insert: {
          created_at?: string
          default_notification_type?: number
          default_send_method?: string
          enabled?: boolean
          environment?: string
          id?: string
          merchant_id: string
          updated_at?: string
          webhook_url?: string | null
        }
        Update: {
          created_at?: string
          default_notification_type?: number
          default_send_method?: string
          enabled?: boolean
          environment?: string
          id?: string
          merchant_id?: string
          updated_at?: string
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "itspaid_settings_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: true
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      itspaid_transfers: {
        Row: {
          admin_message: string | null
          amount: number
          created_at: string
          currency: string
          direction: string
          environment: string
          fees: Json | null
          gateway_error: string | null
          gateway_message: string | null
          id: string
          itspaid_transaction_id: string | null
          merchant_id: string
          plaid_access_token_ref: string | null
          plaid_account_id: string | null
          public_description: string | null
          raw_request: Json | null
          raw_response: Json | null
          recipient_bank_account_last4: string | null
          recipient_bank_routing: string | null
          recipient_email: string | null
          recipient_full_name: string
          recipient_phone: string | null
          send_method: string
          status: string
          transfer_method: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_message?: string | null
          amount: number
          created_at?: string
          currency?: string
          direction?: string
          environment?: string
          fees?: Json | null
          gateway_error?: string | null
          gateway_message?: string | null
          id?: string
          itspaid_transaction_id?: string | null
          merchant_id: string
          plaid_access_token_ref?: string | null
          plaid_account_id?: string | null
          public_description?: string | null
          raw_request?: Json | null
          raw_response?: Json | null
          recipient_bank_account_last4?: string | null
          recipient_bank_routing?: string | null
          recipient_email?: string | null
          recipient_full_name: string
          recipient_phone?: string | null
          send_method: string
          status?: string
          transfer_method?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_message?: string | null
          amount?: number
          created_at?: string
          currency?: string
          direction?: string
          environment?: string
          fees?: Json | null
          gateway_error?: string | null
          gateway_message?: string | null
          id?: string
          itspaid_transaction_id?: string | null
          merchant_id?: string
          plaid_access_token_ref?: string | null
          plaid_account_id?: string | null
          public_description?: string | null
          raw_request?: Json | null
          raw_response?: Json | null
          recipient_bank_account_last4?: string | null
          recipient_bank_routing?: string | null
          recipient_email?: string | null
          recipient_full_name?: string
          recipient_phone?: string | null
          send_method?: string
          status?: string
          transfer_method?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "itspaid_transfers_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      kyb_review_notifications: {
        Row: {
          created_at: string
          doc_id: string
          doc_type: string | null
          file_name: string | null
          id: string
          merchant_id: string | null
          metadata: Json
          read_at: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          doc_id: string
          doc_type?: string | null
          file_name?: string | null
          id?: string
          merchant_id?: string | null
          metadata?: Json
          read_at?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          doc_id?: string
          doc_type?: string | null
          file_name?: string | null
          id?: string
          merchant_id?: string | null
          metadata?: Json
          read_at?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      ledger_accounts: {
        Row: {
          account_type: string
          created_at: string | null
          currency: string
          id: string
          merchant_id: string | null
        }
        Insert: {
          account_type: string
          created_at?: string | null
          currency: string
          id?: string
          merchant_id?: string | null
        }
        Update: {
          account_type?: string
          created_at?: string | null
          currency?: string
          id?: string
          merchant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ledger_accounts_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_entries: {
        Row: {
          account_id: string
          amount: number
          created_at: string
          currency: string
          entry_type: string
          id: string
          transaction_id: string
        }
        Insert: {
          account_id: string
          amount: number
          created_at?: string
          currency: string
          entry_type: string
          id?: string
          transaction_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          created_at?: string
          currency?: string
          entry_type?: string
          id?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entries_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      liquidity_pools: {
        Row: {
          balance: number | null
          created_at: string | null
          currency: string | null
          id: string
          region: string | null
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          region?: string | null
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          region?: string | null
        }
        Relationships: []
      }
      margin_records: {
        Row: {
          created_at: string | null
          fx_cost: number | null
          id: string
          merchant_fee: number | null
          net_margin: number | null
          processor_fee: number | null
          transaction_id: string | null
        }
        Insert: {
          created_at?: string | null
          fx_cost?: number | null
          id?: string
          merchant_fee?: number | null
          net_margin?: number | null
          processor_fee?: number | null
          transaction_id?: string | null
        }
        Update: {
          created_at?: string | null
          fx_cost?: number | null
          id?: string
          merchant_fee?: number | null
          net_margin?: number | null
          processor_fee?: number | null
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "margin_records_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_3ds_settings: {
        Row: {
          auto_enable_high_risk: boolean | null
          created_at: string | null
          decline_threshold: number | null
          enabled: boolean | null
          id: string
          merchant_id: string | null
          risk_threshold: number | null
          skip_if_processor_3ds: boolean | null
          updated_at: string | null
        }
        Insert: {
          auto_enable_high_risk?: boolean | null
          created_at?: string | null
          decline_threshold?: number | null
          enabled?: boolean | null
          id?: string
          merchant_id?: string | null
          risk_threshold?: number | null
          skip_if_processor_3ds?: boolean | null
          updated_at?: string | null
        }
        Update: {
          auto_enable_high_risk?: boolean | null
          created_at?: string | null
          decline_threshold?: number | null
          enabled?: boolean | null
          id?: string
          merchant_id?: string | null
          risk_threshold?: number | null
          skip_if_processor_3ds?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "merchant_3ds_settings_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: true
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_accounts: {
        Row: {
          available_balance: number | null
          currency: string
          id: string
          merchant_id: string | null
          pending_balance: number | null
          reserve_balance: number | null
          updated_at: string | null
        }
        Insert: {
          available_balance?: number | null
          currency: string
          id?: string
          merchant_id?: string | null
          pending_balance?: number | null
          reserve_balance?: number | null
          updated_at?: string | null
        }
        Update: {
          available_balance?: number | null
          currency?: string
          id?: string
          merchant_id?: string | null
          pending_balance?: number | null
          reserve_balance?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "merchant_accounts_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_acquirer_mids: {
        Row: {
          acquirer_id: string
          active: boolean | null
          created_at: string
          id: string
          merchant_id: string
          mid: string
          priority: number | null
          routing_weight: number | null
        }
        Insert: {
          acquirer_id: string
          active?: boolean | null
          created_at?: string
          id?: string
          merchant_id: string
          mid: string
          priority?: number | null
          routing_weight?: number | null
        }
        Update: {
          acquirer_id?: string
          active?: boolean | null
          created_at?: string
          id?: string
          merchant_id?: string
          mid?: string
          priority?: number | null
          routing_weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "merchant_acquirer_mids_acquirer_id_fkey"
            columns: ["acquirer_id"]
            isOneToOne: false
            referencedRelation: "acquirers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchant_acquirer_mids_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_endpoint_rate_limits: {
        Row: {
          burst_limit: number
          created_at: string
          endpoint_type: string
          id: string
          merchant_id: string
          requests_per_minute: number
          updated_at: string
        }
        Insert: {
          burst_limit?: number
          created_at?: string
          endpoint_type: string
          id?: string
          merchant_id: string
          requests_per_minute?: number
          updated_at?: string
        }
        Update: {
          burst_limit?: number
          created_at?: string
          endpoint_type?: string
          id?: string
          merchant_id?: string
          requests_per_minute?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "merchant_endpoint_rate_limits_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_fx_settings: {
        Row: {
          created_at: string
          currency_spreads: Json | null
          default_spread_bps: number
          id: string
          merchant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency_spreads?: Json | null
          default_spread_bps?: number
          id?: string
          merchant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency_spreads?: Json | null
          default_spread_bps?: number
          id?: string
          merchant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "merchant_fx_settings_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: true
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_high_risk_processors: {
        Row: {
          circoflows_enabled: boolean
          circoflows_mode: string
          created_at: string
          elektropay_enabled: boolean
          matrix_enabled: boolean
          matrix_flow: string
          merchant_id: string
          notes: string | null
          plgin_enabled: boolean
          updated_at: string
          valenspay_enabled: boolean
          vertical: string
        }
        Insert: {
          circoflows_enabled?: boolean
          circoflows_mode?: string
          created_at?: string
          elektropay_enabled?: boolean
          matrix_enabled?: boolean
          matrix_flow?: string
          merchant_id: string
          notes?: string | null
          plgin_enabled?: boolean
          updated_at?: string
          valenspay_enabled?: boolean
          vertical?: string
        }
        Update: {
          circoflows_enabled?: boolean
          circoflows_mode?: string
          created_at?: string
          elektropay_enabled?: boolean
          matrix_enabled?: boolean
          matrix_flow?: string
          merchant_id?: string
          notes?: string | null
          plgin_enabled?: boolean
          updated_at?: string
          valenspay_enabled?: boolean
          vertical?: string
        }
        Relationships: [
          {
            foreignKeyName: "merchant_high_risk_processors_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: true
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_pricing: {
        Row: {
          active: boolean
          created_at: string
          currency: string
          fixed_fee: number
          id: string
          merchant_id: string
          model_type: string
          percentage_fee: number
          sponsor_fee_pct: number
          tiers: Json | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          currency?: string
          fixed_fee?: number
          id?: string
          merchant_id: string
          model_type?: string
          percentage_fee?: number
          sponsor_fee_pct?: number
          tiers?: Json | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          currency?: string
          fixed_fee?: number
          id?: string
          merchant_id?: string
          model_type?: string
          percentage_fee?: number
          sponsor_fee_pct?: number
          tiers?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "merchant_pricing_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_processor_descriptors: {
        Row: {
          active: boolean
          created_at: string
          descriptor: string
          descriptor_text: string | null
          id: string
          merchant_id: string
          notes: string | null
          processor: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          descriptor: string
          descriptor_text?: string | null
          id?: string
          merchant_id: string
          notes?: string | null
          processor: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          descriptor?: string
          descriptor_text?: string | null
          id?: string
          merchant_id?: string
          notes?: string | null
          processor?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "merchant_processor_descriptors_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchant_processor_descriptors_processor_fkey"
            columns: ["processor"]
            isOneToOne: false
            referencedRelation: "payment_processors"
            referencedColumns: ["name"]
          },
        ]
      }
      merchant_profiles: {
        Row: {
          address: Json | null
          business_name: string | null
          business_type: string | null
          contact_number: string | null
          country: string | null
          created_at: string
          id: string
          industry: string | null
          kyb_verified_at: string | null
          mcc_code: string | null
          merchant_id: string
          onboarding_status: string
          registration_number: string | null
          tax_id: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: Json | null
          business_name?: string | null
          business_type?: string | null
          contact_number?: string | null
          country?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          kyb_verified_at?: string | null
          mcc_code?: string | null
          merchant_id: string
          onboarding_status?: string
          registration_number?: string | null
          tax_id?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: Json | null
          business_name?: string | null
          business_type?: string | null
          contact_number?: string | null
          country?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          kyb_verified_at?: string | null
          mcc_code?: string | null
          merchant_id?: string
          onboarding_status?: string
          registration_number?: string | null
          tax_id?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "merchant_profiles_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: true
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_risk_profiles: {
        Row: {
          adaptive_multiplier: number
          chargeback_rate: number | null
          created_at: string
          fraud_score: number | null
          id: string
          locked: boolean
          merchant_id: string
          risk_score: number
          success_rate: number | null
          updated_at: string
          velocity_score: number | null
        }
        Insert: {
          adaptive_multiplier?: number
          chargeback_rate?: number | null
          created_at?: string
          fraud_score?: number | null
          id?: string
          locked?: boolean
          merchant_id: string
          risk_score?: number
          success_rate?: number | null
          updated_at?: string
          velocity_score?: number | null
        }
        Update: {
          adaptive_multiplier?: number
          chargeback_rate?: number | null
          created_at?: string
          fraud_score?: number | null
          id?: string
          locked?: boolean
          merchant_id?: string
          risk_score?: number
          success_rate?: number | null
          updated_at?: string
          velocity_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "merchant_risk_profiles_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: true
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_risk_signals: {
        Row: {
          id: string
          merchant_id: string
          recorded_at: string
          signal_type: string
          value: number
        }
        Insert: {
          id?: string
          merchant_id: string
          recorded_at?: string
          signal_type: string
          value: number
        }
        Update: {
          id?: string
          merchant_id?: string
          recorded_at?: string
          signal_type?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "merchant_risk_signals_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      merchants: {
        Row: {
          api_key_hash: string | null
          circoflows_mid: string | null
          created_at: string
          currency: string | null
          email: string | null
          gambling_enabled: boolean
          id: string
          name: string
          phone: string | null
          region: string | null
          risk_score: number | null
          status: string | null
          updated_at: string
          user_id: string
          webhook_url: string | null
        }
        Insert: {
          api_key_hash?: string | null
          circoflows_mid?: string | null
          created_at?: string
          currency?: string | null
          email?: string | null
          gambling_enabled?: boolean
          id?: string
          name: string
          phone?: string | null
          region?: string | null
          risk_score?: number | null
          status?: string | null
          updated_at?: string
          user_id: string
          webhook_url?: string | null
        }
        Update: {
          api_key_hash?: string | null
          circoflows_mid?: string | null
          created_at?: string
          currency?: string | null
          email?: string | null
          gambling_enabled?: boolean
          id?: string
          name?: string
          phone?: string | null
          region?: string | null
          risk_score?: number | null
          status?: string | null
          updated_at?: string
          user_id?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      migration_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          data_types: string[]
          error_log: Json | null
          file_url: string | null
          id: string
          import_method: string
          imported_records: number | null
          merchant_id: string
          progress_pct: number
          source_gateway: string
          status: string
          total_records: number | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          data_types?: string[]
          error_log?: Json | null
          file_url?: string | null
          id?: string
          import_method?: string
          imported_records?: number | null
          merchant_id: string
          progress_pct?: number
          source_gateway: string
          status?: string
          total_records?: number | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          data_types?: string[]
          error_log?: Json | null
          file_url?: string | null
          id?: string
          import_method?: string
          imported_records?: number | null
          merchant_id?: string
          progress_pct?: number
          source_gateway?: string
          status?: string
          total_records?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "migration_jobs_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          currency: string
          customer_email: string | null
          customer_id: string | null
          customer_name: string | null
          discount_amount: number
          id: string
          invoice_id: string | null
          merchant_id: string
          metadata: Json | null
          notes: string | null
          order_number: string
          payment_intent_id: string | null
          payment_method: string | null
          shipping_amount: number
          status: string
          subtotal: number
          tax_amount: number
          total_amount: number
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          discount_amount?: number
          id?: string
          invoice_id?: string | null
          merchant_id: string
          metadata?: Json | null
          notes?: string | null
          order_number: string
          payment_intent_id?: string | null
          payment_method?: string | null
          shipping_amount?: number
          status?: string
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          discount_amount?: number
          id?: string
          invoice_id?: string | null
          merchant_id?: string
          metadata?: Json | null
          notes?: string | null
          order_number?: string
          payment_intent_id?: string | null
          payment_method?: string | null
          shipping_amount?: number
          status?: string
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_payment_intent_id_fkey"
            columns: ["payment_intent_id"]
            isOneToOne: false
            referencedRelation: "payment_intents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_attempts: {
        Row: {
          attempt_number: number
          created_at: string
          id: string
          latency_ms: number | null
          provider: string
          response_code: string | null
          response_message: string | null
          status: string
          transaction_id: string
        }
        Insert: {
          attempt_number?: number
          created_at?: string
          id?: string
          latency_ms?: number | null
          provider: string
          response_code?: string | null
          response_message?: string | null
          status?: string
          transaction_id: string
        }
        Update: {
          attempt_number?: number
          created_at?: string
          id?: string
          latency_ms?: number | null
          provider?: string
          response_code?: string | null
          response_message?: string | null
          status?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_attempts_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_intents: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          merchant_id: string
          metadata: Json | null
          payment_method: string | null
          processor_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          merchant_id: string
          metadata?: Json | null
          payment_method?: string | null
          processor_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          merchant_id?: string
          metadata?: Json | null
          payment_method?: string | null
          processor_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_intents_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_links: {
        Row: {
          amount: number | null
          cancel_url: string | null
          created_at: string
          currency: string
          customer_email: string | null
          customer_name: string | null
          description: string | null
          id: string
          merchant_id: string
          order_id: string | null
          payment_method: string | null
          products: Json | null
          status: string
          success_url: string | null
          updated_at: string
          url: string
        }
        Insert: {
          amount?: number | null
          cancel_url?: string | null
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_name?: string | null
          description?: string | null
          id?: string
          merchant_id: string
          order_id?: string | null
          payment_method?: string | null
          products?: Json | null
          status?: string
          success_url?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          amount?: number | null
          cancel_url?: string | null
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_name?: string | null
          description?: string | null
          id?: string
          merchant_id?: string
          order_id?: string | null
          payment_method?: string | null
          products?: Json | null
          status?: string
          success_url?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          card_brand: string | null
          card_last4: string | null
          card_updater_enabled: boolean | null
          created_at: string
          customer_id: string
          exp_month: string | null
          exp_year: string | null
          id: string
          is_default: boolean
          last_used_at: string | null
          merchant_id: string | null
          network_token_status: string | null
          previous_token_id: string | null
          status: string
          token_last_updated: string | null
          updated_at: string
          usage_count: number
          vgs_alias: string
        }
        Insert: {
          card_brand?: string | null
          card_last4?: string | null
          card_updater_enabled?: boolean | null
          created_at?: string
          customer_id: string
          exp_month?: string | null
          exp_year?: string | null
          id?: string
          is_default?: boolean
          last_used_at?: string | null
          merchant_id?: string | null
          network_token_status?: string | null
          previous_token_id?: string | null
          status?: string
          token_last_updated?: string | null
          updated_at?: string
          usage_count?: number
          vgs_alias: string
        }
        Update: {
          card_brand?: string | null
          card_last4?: string | null
          card_updater_enabled?: boolean | null
          created_at?: string
          customer_id?: string
          exp_month?: string | null
          exp_year?: string | null
          id?: string
          is_default?: boolean
          last_used_at?: string | null
          merchant_id?: string | null
          network_token_status?: string | null
          previous_token_id?: string | null
          status?: string
          token_last_updated?: string | null
          updated_at?: string
          usage_count?: number
          vgs_alias?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_methods_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_methods_previous_token_id_fkey"
            columns: ["previous_token_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_processors: {
        Row: {
          acquirer_descriptor: string | null
          active: boolean
          created_at: string
          display_name: string | null
          name: string
          updated_at: string
        }
        Insert: {
          acquirer_descriptor?: string | null
          active?: boolean
          created_at?: string
          display_name?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          acquirer_descriptor?: string | null
          active?: boolean
          created_at?: string
          display_name?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      payouts: {
        Row: {
          amount: number | null
          created_at: string | null
          external_id: string | null
          id: string
          merchant_id: string | null
          method: string | null
          processor: string | null
          status: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          external_id?: string | null
          id?: string
          merchant_id?: string | null
          method?: string | null
          processor?: string | null
          status?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          external_id?: string | null
          id?: string
          merchant_id?: string | null
          method?: string | null
          processor?: string | null
          status?: string | null
        }
        Relationships: []
      }
      platform_fee_markups: {
        Row: {
          active: boolean
          created_at: string
          id: string
          markup_flat_fee: number
          markup_percentage: number
          merchant_id: string | null
          processor_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          markup_flat_fee?: number
          markup_percentage?: number
          merchant_id?: string | null
          processor_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          markup_flat_fee?: number
          markup_percentage?: number
          merchant_id?: string | null
          processor_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_fee_markups_processor_id_fkey"
            columns: ["processor_id"]
            isOneToOne: false
            referencedRelation: "processors"
            referencedColumns: ["id"]
          },
        ]
      }
      processor_fee_profiles: {
        Row: {
          chargeback_fee: number
          created_at: string
          currency: string
          fixed_fee: number
          id: string
          merchant_id: string
          percentage_fee: number
          provider: string
          refund_fee: number
          settlement_days: number
          updated_at: string
        }
        Insert: {
          chargeback_fee?: number
          created_at?: string
          currency?: string
          fixed_fee?: number
          id?: string
          merchant_id: string
          percentage_fee?: number
          provider: string
          refund_fee?: number
          settlement_days?: number
          updated_at?: string
        }
        Update: {
          chargeback_fee?: number
          created_at?: string
          currency?: string
          fixed_fee?: number
          id?: string
          merchant_id?: string
          percentage_fee?: number
          provider?: string
          refund_fee?: number
          settlement_days?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "processor_fee_profiles_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      processor_metrics: {
        Row: {
          avg_fee: number | null
          avg_latency: number | null
          id: string
          processor_id: string | null
          region: string | null
          success_rate: number | null
          updated_at: string | null
        }
        Insert: {
          avg_fee?: number | null
          avg_latency?: number | null
          id?: string
          processor_id?: string | null
          region?: string | null
          success_rate?: number | null
          updated_at?: string | null
        }
        Update: {
          avg_fee?: number | null
          avg_latency?: number | null
          id?: string
          processor_id?: string | null
          region?: string | null
          success_rate?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      processor_pricing: {
        Row: {
          brand: string | null
          category: string
          condition: string | null
          created_at: string
          currency: string | null
          display_order: number
          fixed_amount: number | null
          id: string
          note: string | null
          processor_id: string
          rate: number | null
          updated_at: string
        }
        Insert: {
          brand?: string | null
          category: string
          condition?: string | null
          created_at?: string
          currency?: string | null
          display_order?: number
          fixed_amount?: number | null
          id?: string
          note?: string | null
          processor_id: string
          rate?: number | null
          updated_at?: string
        }
        Update: {
          brand?: string | null
          category?: string
          condition?: string | null
          created_at?: string
          currency?: string | null
          display_order?: number
          fixed_amount?: number | null
          id?: string
          note?: string | null
          processor_id?: string
          rate?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "processor_pricing_processor_id_fkey"
            columns: ["processor_id"]
            isOneToOne: false
            referencedRelation: "processors"
            referencedColumns: ["id"]
          },
        ]
      }
      processor_strategy: {
        Row: {
          created_at: string
          fallback_processor_id: string | null
          id: string
          processor_id: string
          routing_priority: number
          tier_level: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          fallback_processor_id?: string | null
          id?: string
          processor_id: string
          routing_priority?: number
          tier_level?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          fallback_processor_id?: string | null
          id?: string
          processor_id?: string
          routing_priority?: number
          tier_level?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "processor_strategy_fallback_processor_id_fkey"
            columns: ["fallback_processor_id"]
            isOneToOne: false
            referencedRelation: "processors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processor_strategy_processor_id_fkey"
            columns: ["processor_id"]
            isOneToOne: true
            referencedRelation: "processors"
            referencedColumns: ["id"]
          },
        ]
      }
      processors: {
        Row: {
          active: boolean
          approval_rate: number
          created_at: string
          currencies: string[]
          id: string
          name: string
          region: string[]
          tier: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          approval_rate?: number
          created_at?: string
          currencies?: string[]
          id: string
          name: string
          region?: string[]
          tier?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          approval_rate?: number
          created_at?: string
          currencies?: string[]
          id?: string
          name?: string
          region?: string[]
          tier?: string
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string | null
          cost_price: number | null
          created_at: string
          description: string | null
          dimensions: Json | null
          id: string
          image_url: string | null
          merchant_id: string
          metadata: Json | null
          name: string
          price: number
          product_type: string | null
          sku: string | null
          stock: number
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          dimensions?: Json | null
          id?: string
          image_url?: string | null
          merchant_id: string
          metadata?: Json | null
          name: string
          price?: number
          product_type?: string | null
          sku?: string | null
          stock?: number
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          dimensions?: Json | null
          id?: string
          image_url?: string | null
          merchant_id?: string
          metadata?: Json | null
          name?: string
          price?: number
          product_type?: string | null
          sku?: string | null
          stock?: number
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      provider_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          merchant_id: string
          payload: Json
          provider: string
          transaction_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          merchant_id: string
          payload?: Json
          provider: string
          transaction_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          merchant_id?: string
          payload?: Json
          provider?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_events_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_events_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_onboardings: {
        Row: {
          created_at: string
          error_message: string | null
          external_id: string | null
          id: string
          merchant_id: string
          metadata: Json | null
          provider: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          external_id?: string | null
          id?: string
          merchant_id: string
          metadata?: Json | null
          provider: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          external_id?: string | null
          id?: string
          merchant_id?: string
          metadata?: Json | null
          provider?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      psp_routes: {
        Row: {
          active: boolean | null
          card_brand: string | null
          country: string | null
          created_at: string | null
          id: string
          merchant_id: string | null
          priority: number | null
          processor: string
          risk_level: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          card_brand?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          merchant_id?: string | null
          priority?: number | null
          processor: string
          risk_level?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          card_brand?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          merchant_id?: string | null
          priority?: number | null
          processor?: string
          risk_level?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "psp_routes_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      rebelfi_poll_settings: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          interval_seconds: number
          last_error: string | null
          last_run_at: string | null
          last_status: string | null
          merchant_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          interval_seconds?: number
          last_error?: string | null
          last_run_at?: string | null
          last_status?: string | null
          merchant_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          interval_seconds?: number
          last_error?: string | null
          last_run_at?: string | null
          last_status?: string | null
          merchant_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      rebelfi_proxy_cache: {
        Row: {
          cache_key: string
          fetched_at: string
          payload: Json
          upstream_ok: boolean
        }
        Insert: {
          cache_key: string
          fetched_at?: string
          payload: Json
          upstream_ok?: boolean
        }
        Update: {
          cache_key?: string
          fetched_at?: string
          payload?: Json
          upstream_ok?: boolean
        }
        Relationships: []
      }
      rebelfi_sync_runs: {
        Row: {
          created_at: string
          dry_run: boolean
          duration_ms: number | null
          errors: Json
          id: string
          inserted: number
          merchant_id: string | null
          scanned: number
          skipped: number
          skipped_details: Json
          source: string
          status: string
          updated: number
          user_id: string
          verification: Json
        }
        Insert: {
          created_at?: string
          dry_run?: boolean
          duration_ms?: number | null
          errors?: Json
          id?: string
          inserted?: number
          merchant_id?: string | null
          scanned?: number
          skipped?: number
          skipped_details?: Json
          source?: string
          status?: string
          updated?: number
          user_id: string
          verification?: Json
        }
        Update: {
          created_at?: string
          dry_run?: boolean
          duration_ms?: number | null
          errors?: Json
          id?: string
          inserted?: number
          merchant_id?: string | null
          scanned?: number
          skipped?: number
          skipped_details?: Json
          source?: string
          status?: string
          updated?: number
          user_id?: string
          verification?: Json
        }
        Relationships: []
      }
      recipients_intl: {
        Row: {
          account_number: string | null
          account_type: string | null
          address_line1: string | null
          address_line2: string | null
          bank_name: string | null
          branch_code: string | null
          bsb_code: string | null
          city: string | null
          clabe: string | null
          country: string
          created_at: string
          currency: string
          email: string | null
          full_name: string
          iban: string | null
          id: string
          ifsc_code: string | null
          intermediary_bank: string | null
          merchant_id: string | null
          metadata: Json | null
          phone: string | null
          postal_code: string | null
          rail: string
          recipient_type: string
          routing_number: string | null
          sort_code: string | null
          state: string | null
          status: string
          swift_bic: string | null
          updated_at: string
          wallet_address: string | null
          wallet_network: string | null
        }
        Insert: {
          account_number?: string | null
          account_type?: string | null
          address_line1?: string | null
          address_line2?: string | null
          bank_name?: string | null
          branch_code?: string | null
          bsb_code?: string | null
          city?: string | null
          clabe?: string | null
          country: string
          created_at?: string
          currency: string
          email?: string | null
          full_name: string
          iban?: string | null
          id?: string
          ifsc_code?: string | null
          intermediary_bank?: string | null
          merchant_id?: string | null
          metadata?: Json | null
          phone?: string | null
          postal_code?: string | null
          rail: string
          recipient_type: string
          routing_number?: string | null
          sort_code?: string | null
          state?: string | null
          status?: string
          swift_bic?: string | null
          updated_at?: string
          wallet_address?: string | null
          wallet_network?: string | null
        }
        Update: {
          account_number?: string | null
          account_type?: string | null
          address_line1?: string | null
          address_line2?: string | null
          bank_name?: string | null
          branch_code?: string | null
          bsb_code?: string | null
          city?: string | null
          clabe?: string | null
          country?: string
          created_at?: string
          currency?: string
          email?: string | null
          full_name?: string
          iban?: string | null
          id?: string
          ifsc_code?: string | null
          intermediary_bank?: string | null
          merchant_id?: string | null
          metadata?: Json | null
          phone?: string | null
          postal_code?: string | null
          rail?: string
          recipient_type?: string
          routing_number?: string | null
          sort_code?: string | null
          state?: string | null
          status?: string
          swift_bic?: string | null
          updated_at?: string
          wallet_address?: string | null
          wallet_network?: string | null
        }
        Relationships: []
      }
      reconciliation_reports: {
        Row: {
          created_at: string
          currency: string
          difference: number | null
          id: string
          internal_total: number | null
          merchant_id: string
          metadata: Json | null
          processor_total: number | null
          report_date: string
          status: string
        }
        Insert: {
          created_at?: string
          currency?: string
          difference?: number | null
          id?: string
          internal_total?: number | null
          merchant_id: string
          metadata?: Json | null
          processor_total?: number | null
          report_date?: string
          status?: string
        }
        Update: {
          created_at?: string
          currency?: string
          difference?: number | null
          id?: string
          internal_total?: number | null
          merchant_id?: string
          metadata?: Json | null
          processor_total?: number | null
          report_date?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reconciliation_reports_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      refunds: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          merchant_id: string
          provider: string | null
          provider_ref: string | null
          reason: string | null
          status: string
          transaction_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency: string
          id?: string
          merchant_id: string
          provider?: string | null
          provider_ref?: string | null
          reason?: string | null
          status?: string
          transaction_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          merchant_id?: string
          provider?: string | null
          provider_ref?: string | null
          reason?: string | null
          status?: string
          transaction_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      reseller_splits: {
        Row: {
          active: boolean
          created_at: string
          id: string
          merchant_id: string
          reseller_id: string
          revenue_share_pct: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          merchant_id: string
          reseller_id: string
          revenue_share_pct?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          merchant_id?: string
          reseller_id?: string
          revenue_share_pct?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reseller_splits_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      reserves: {
        Row: {
          amount: number | null
          created_at: string | null
          id: string
          merchant_id: string | null
          payment_id: string | null
          release_date: string | null
          status: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          id?: string
          merchant_id?: string | null
          payment_id?: string | null
          release_date?: string | null
          status?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          id?: string
          merchant_id?: string | null
          payment_id?: string | null
          release_date?: string | null
          status?: string | null
        }
        Relationships: []
      }
      risk_rules: {
        Row: {
          action: string
          active: boolean
          condition: Json
          created_at: string
          id: string
          merchant_id: string | null
          name: string
          severity: string
        }
        Insert: {
          action?: string
          active?: boolean
          condition?: Json
          created_at?: string
          id?: string
          merchant_id?: string | null
          name: string
          severity?: string
        }
        Update: {
          action?: string
          active?: boolean
          condition?: Json
          created_at?: string
          id?: string
          merchant_id?: string | null
          name?: string
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "risk_rules_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      rolling_reserves: {
        Row: {
          amount: number
          created_at: string
          currency: string
          held_at: string
          id: string
          merchant_id: string
          release_at: string
          released_at: string | null
          reserve_percent: number
          status: string
          transaction_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency: string
          held_at?: string
          id?: string
          merchant_id: string
          release_at: string
          released_at?: string | null
          reserve_percent?: number
          status?: string
          transaction_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          held_at?: string
          id?: string
          merchant_id?: string
          release_at?: string
          released_at?: string | null
          reserve_percent?: number
          status?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rolling_reserves_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rolling_reserves_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      routing_attempt_logs: {
        Row: {
          attempt_order: number
          created_at: string
          id: string
          processor_id: string
          response_code: string | null
          response_time: number | null
          status: string
          transaction_id: string
        }
        Insert: {
          attempt_order?: number
          created_at?: string
          id?: string
          processor_id: string
          response_code?: string | null
          response_time?: number | null
          status?: string
          transaction_id: string
        }
        Update: {
          attempt_order?: number
          created_at?: string
          id?: string
          processor_id?: string
          response_code?: string | null
          response_time?: number | null
          status?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "routing_attempt_logs_processor_id_fkey"
            columns: ["processor_id"]
            isOneToOne: false
            referencedRelation: "processors"
            referencedColumns: ["id"]
          },
        ]
      }
      routing_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          after: Json | null
          before: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          merchant_id: string | null
          metadata: Json | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          merchant_id?: string | null
          metadata?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          merchant_id?: string | null
          metadata?: Json | null
        }
        Relationships: []
      }
      routing_idempotency: {
        Row: {
          created_at: string
          expires_at: string
          key: string
          operation: string
          response: Json | null
          transaction_id: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string
          key: string
          operation: string
          response?: Json | null
          transaction_id?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          key?: string
          operation?: string
          response?: Json | null
          transaction_id?: string | null
        }
        Relationships: []
      }
      routing_rules: {
        Row: {
          active: boolean
          amount_max: number | null
          amount_min: number | null
          created_at: string
          currency_match: string[] | null
          fallback_provider: string | null
          id: string
          merchant_id: string
          name: string
          priority: number
          target_provider: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          amount_max?: number | null
          amount_min?: number | null
          created_at?: string
          currency_match?: string[] | null
          fallback_provider?: string | null
          id?: string
          merchant_id: string
          name: string
          priority?: number
          target_provider: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          amount_max?: number | null
          amount_min?: number | null
          created_at?: string
          currency_match?: string[] | null
          fallback_provider?: string | null
          id?: string
          merchant_id?: string
          name?: string
          priority?: number
          target_provider?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "routing_rules_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_bank_accounts: {
        Row: {
          account_holder_name: string
          account_last4: string
          created_at: string
          currency: string
          id: string
          institution_number: string
          is_default: boolean
          merchant_id: string
          nickname: string | null
          transit_number: string
          updated_at: string
        }
        Insert: {
          account_holder_name: string
          account_last4: string
          created_at?: string
          currency?: string
          id?: string
          institution_number: string
          is_default?: boolean
          merchant_id: string
          nickname?: string | null
          transit_number: string
          updated_at?: string
        }
        Update: {
          account_holder_name?: string
          account_last4?: string
          created_at?: string
          currency?: string
          id?: string
          institution_number?: string
          is_default?: boolean
          merchant_id?: string
          nickname?: string | null
          transit_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_bank_accounts_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      security_alerts: {
        Row: {
          category: Database["public"]["Enums"]["alert_category"]
          created_at: string
          details: Json
          id: string
          merchant_id: string | null
          message: string
          resolved: boolean
          resolved_at: string | null
          resolved_by: string | null
          severity: Database["public"]["Enums"]["alert_severity"]
          source: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["alert_category"]
          created_at?: string
          details?: Json
          id?: string
          merchant_id?: string | null
          message: string
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          source: string
        }
        Update: {
          category?: Database["public"]["Enums"]["alert_category"]
          created_at?: string
          details?: Json
          id?: string
          merchant_id?: string | null
          message?: string
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          source?: string
        }
        Relationships: []
      }
      settlement_batches: {
        Row: {
          created_at: string
          currency: string
          id: string
          processor: string
          settled_at: string | null
          status: string
          total_amount: number
          transaction_count: number
        }
        Insert: {
          created_at?: string
          currency: string
          id?: string
          processor: string
          settled_at?: string | null
          status?: string
          total_amount?: number
          transaction_count?: number
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          processor?: string
          settled_at?: string | null
          status?: string
          total_amount?: number
          transaction_count?: number
        }
        Relationships: []
      }
      settlement_instructions: {
        Row: {
          amount: number | null
          created_at: string | null
          currency: string | null
          id: string
          merchant_id: string | null
          rail: string | null
          settlement_run_id: string | null
          status: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          merchant_id?: string | null
          rail?: string | null
          settlement_run_id?: string | null
          status?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          merchant_id?: string | null
          rail?: string | null
          settlement_run_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "settlement_instructions_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlement_instructions_settlement_run_id_fkey"
            columns: ["settlement_run_id"]
            isOneToOne: false
            referencedRelation: "settlement_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      settlement_runs: {
        Row: {
          created_at: string | null
          currency: string | null
          id: string
          merchant_count: number | null
          status: string | null
          total_amount: number | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          id?: string
          merchant_count?: number | null
          status?: string | null
          total_amount?: number | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          id?: string
          merchant_count?: number | null
          status?: string | null
          total_amount?: number | null
        }
        Relationships: []
      }
      settlements: {
        Row: {
          batch_id: string | null
          created_at: string | null
          currency: string | null
          fee: number | null
          gross_amount: number | null
          id: string
          merchant_id: string | null
          net_amount: number | null
          payment_id: string | null
          processor: string | null
          scheduled_at: string | null
          settled_at: string | null
          settlement_currency: string | null
          status: string | null
        }
        Insert: {
          batch_id?: string | null
          created_at?: string | null
          currency?: string | null
          fee?: number | null
          gross_amount?: number | null
          id?: string
          merchant_id?: string | null
          net_amount?: number | null
          payment_id?: string | null
          processor?: string | null
          scheduled_at?: string | null
          settled_at?: string | null
          settlement_currency?: string | null
          status?: string | null
        }
        Update: {
          batch_id?: string | null
          created_at?: string | null
          currency?: string | null
          fee?: number | null
          gross_amount?: number | null
          id?: string
          merchant_id?: string | null
          net_amount?: number | null
          payment_id?: string | null
          processor?: string | null
          scheduled_at?: string | null
          settled_at?: string | null
          settlement_currency?: string | null
          status?: string | null
        }
        Relationships: []
      }
      shopify_app_credentials: {
        Row: {
          client_id: string
          client_secret_encrypted: string
          created_at: string
          id: string
          merchant_id: string
          updated_at: string
        }
        Insert: {
          client_id?: string
          client_secret_encrypted?: string
          created_at?: string
          id?: string
          merchant_id: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          client_secret_encrypted?: string
          created_at?: string
          id?: string
          merchant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopify_app_credentials_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: true
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      shopify_orders: {
        Row: {
          amount: number | null
          created_at: string | null
          currency: string | null
          id: string
          shopify_order_id: string | null
          status: string | null
          store_id: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          shopify_order_id?: string | null
          status?: string | null
          store_id?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          shopify_order_id?: string | null
          status?: string | null
          store_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shopify_orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "shopify_stores"
            referencedColumns: ["id"]
          },
        ]
      }
      shopify_products: {
        Row: {
          created_at: string | null
          id: string
          price: number | null
          shopify_product_id: string | null
          store_id: string | null
          title: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          price?: number | null
          shopify_product_id?: string | null
          store_id?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          price?: number | null
          shopify_product_id?: string | null
          store_id?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shopify_products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "shopify_stores"
            referencedColumns: ["id"]
          },
        ]
      }
      shopify_stores: {
        Row: {
          access_token: string | null
          auth_tag: string | null
          encrypted_token: string | null
          id: string
          installed_at: string | null
          iv: string | null
          merchant_id: string | null
          scope: string | null
          shop_domain: string | null
          uninstalled: boolean | null
          webhook_secret: string | null
        }
        Insert: {
          access_token?: string | null
          auth_tag?: string | null
          encrypted_token?: string | null
          id?: string
          installed_at?: string | null
          iv?: string | null
          merchant_id?: string | null
          scope?: string | null
          shop_domain?: string | null
          uninstalled?: boolean | null
          webhook_secret?: string | null
        }
        Update: {
          access_token?: string | null
          auth_tag?: string | null
          encrypted_token?: string | null
          id?: string
          installed_at?: string | null
          iv?: string | null
          merchant_id?: string | null
          scope?: string | null
          shop_domain?: string | null
          uninstalled?: boolean | null
          webhook_secret?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shopify_stores_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plan_prices: {
        Row: {
          created_at: string
          currency: string
          id: string
          is_default: boolean
          plan_id: string
          subscription_price: number
          trial_price: number
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          is_default?: boolean
          plan_id: string
          subscription_price?: number
          trial_price?: number
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          is_default?: boolean
          plan_id?: string
          subscription_price?: number
          trial_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "subscription_plan_prices_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          amount: number
          billing_period_unit: string
          created_at: string
          currency: string
          description: string | null
          ends_after_count: number | null
          ends_after_unit: string | null
          ends_type: string
          id: string
          interval: string
          interval_count: number
          merchant_id: string
          name: string
          retry_logic: string
          starts_day: number | null
          starts_weekday: string | null
          starts_weekday_occurrence: number | null
          status: string
          subscription_starts: string
          trial_days: number | null
          trial_duration: number | null
          trial_enabled: boolean
          trial_price: number | null
          trial_unit: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          billing_period_unit?: string
          created_at?: string
          currency: string
          description?: string | null
          ends_after_count?: number | null
          ends_after_unit?: string | null
          ends_type?: string
          id?: string
          interval: string
          interval_count?: number
          merchant_id: string
          name: string
          retry_logic?: string
          starts_day?: number | null
          starts_weekday?: string | null
          starts_weekday_occurrence?: number | null
          status?: string
          subscription_starts?: string
          trial_days?: number | null
          trial_duration?: number | null
          trial_enabled?: boolean
          trial_price?: number | null
          trial_unit?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          billing_period_unit?: string
          created_at?: string
          currency?: string
          description?: string | null
          ends_after_count?: number | null
          ends_after_unit?: string | null
          ends_type?: string
          id?: string
          interval?: string
          interval_count?: number
          merchant_id?: string
          name?: string
          retry_logic?: string
          starts_day?: number | null
          starts_weekday?: string | null
          starts_weekday_occurrence?: number | null
          status?: string
          subscription_starts?: string
          trial_days?: number | null
          trial_duration?: number | null
          trial_enabled?: boolean
          trial_price?: number | null
          trial_unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_plans_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          canceled_at: string | null
          created_at: string
          current_period_end: string
          current_period_start: string
          customer_id: string
          id: string
          payment_method_id: string
          plan_id: string
          status: string
          trial_end: string | null
          updated_at: string
        }
        Insert: {
          canceled_at?: string | null
          created_at?: string
          current_period_end: string
          current_period_start: string
          customer_id: string
          id?: string
          payment_method_id: string
          plan_id: string
          status?: string
          trial_end?: string | null
          updated_at?: string
        }
        Update: {
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          customer_id?: string
          id?: string
          payment_method_id?: string
          plan_id?: string
          status?: string
          trial_end?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      surcharge_settings: {
        Row: {
          apply_to_credit: boolean | null
          apply_to_debit: boolean | null
          created_at: string | null
          disclosure_text: string | null
          enabled: boolean | null
          fixed_fee: number | null
          id: string
          max_fee_cap: number | null
          merchant_id: string
          percentage_fee: number | null
          updated_at: string | null
        }
        Insert: {
          apply_to_credit?: boolean | null
          apply_to_debit?: boolean | null
          created_at?: string | null
          disclosure_text?: string | null
          enabled?: boolean | null
          fixed_fee?: number | null
          id?: string
          max_fee_cap?: number | null
          merchant_id: string
          percentage_fee?: number | null
          updated_at?: string | null
        }
        Update: {
          apply_to_credit?: boolean | null
          apply_to_debit?: boolean | null
          created_at?: string | null
          disclosure_text?: string | null
          enabled?: boolean | null
          fixed_fee?: number | null
          id?: string
          max_fee_cap?: number | null
          merchant_id?: string
          percentage_fee?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "surcharge_settings_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: true
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      tapix_enrichment_cache: {
        Row: {
          created_at: string
          enrichment_type: string
          id: string
          merchant_data: Json | null
          merchant_id: string
          merchant_uid: string | null
          raw_find_response: Json | null
          shop_data: Json | null
          shop_uid: string | null
          tapix_handle: string | null
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          enrichment_type?: string
          id?: string
          merchant_data?: Json | null
          merchant_id: string
          merchant_uid?: string | null
          raw_find_response?: Json | null
          shop_data?: Json | null
          shop_uid?: string | null
          tapix_handle?: string | null
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          enrichment_type?: string
          id?: string
          merchant_data?: Json | null
          merchant_id?: string
          merchant_uid?: string | null
          raw_find_response?: Json | null
          shop_data?: Json | null
          shop_uid?: string | null
          tapix_handle?: string | null
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tapix_enrichment_cache_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tapix_enrichment_cache_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: true
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      threeds_acs_merchants: {
        Row: {
          acquirer_bin: string | null
          acquirer_merchant_id: string | null
          acquirer_name: string | null
          acs_merchant_id: string
          country: string | null
          created_at: string
          id: string
          mcc: string | null
          merchant_id_ref: string | null
          merchant_name: string
          merchant_url: string | null
          status: string
          updated_at: string
        }
        Insert: {
          acquirer_bin?: string | null
          acquirer_merchant_id?: string | null
          acquirer_name?: string | null
          acs_merchant_id: string
          country?: string | null
          created_at?: string
          id?: string
          mcc?: string | null
          merchant_id_ref?: string | null
          merchant_name: string
          merchant_url?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          acquirer_bin?: string | null
          acquirer_merchant_id?: string | null
          acquirer_name?: string | null
          acs_merchant_id?: string
          country?: string | null
          created_at?: string
          id?: string
          mcc?: string | null
          merchant_id_ref?: string | null
          merchant_name?: string
          merchant_url?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "threeds_acs_merchants_merchant_id_ref_fkey"
            columns: ["merchant_id_ref"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      threeds_acs_users: {
        Row: {
          client_cert_expires_at: string | null
          client_cert_fingerprint: string | null
          client_cert_pem: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          last_login_at: string | null
          master_auth_enabled: boolean
          role: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          client_cert_expires_at?: string | null
          client_cert_fingerprint?: string | null
          client_cert_pem?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          last_login_at?: string | null
          master_auth_enabled?: boolean
          role?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          client_cert_expires_at?: string | null
          client_cert_fingerprint?: string | null
          client_cert_pem?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          last_login_at?: string | null
          master_auth_enabled?: boolean
          role?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      threeds_requestor_config: {
        Row: {
          acs_merchant_id: string
          api_version: string
          created_at: string
          decoupled_auth_enabled: boolean
          enabled: boolean
          id: string
          message_extensions: Json
          notification_url: string | null
          requestor_id: string
          requestor_name: string
          requestor_url: string | null
          result_endpoint_url: string | null
          supported_brands: string[]
          three_ri_enabled: boolean
          threeds_method_url: string | null
          updated_at: string
          whitelisting_enabled: boolean
        }
        Insert: {
          acs_merchant_id: string
          api_version?: string
          created_at?: string
          decoupled_auth_enabled?: boolean
          enabled?: boolean
          id?: string
          message_extensions?: Json
          notification_url?: string | null
          requestor_id: string
          requestor_name: string
          requestor_url?: string | null
          result_endpoint_url?: string | null
          supported_brands?: string[]
          three_ri_enabled?: boolean
          threeds_method_url?: string | null
          updated_at?: string
          whitelisting_enabled?: boolean
        }
        Update: {
          acs_merchant_id?: string
          api_version?: string
          created_at?: string
          decoupled_auth_enabled?: boolean
          enabled?: boolean
          id?: string
          message_extensions?: Json
          notification_url?: string | null
          requestor_id?: string
          requestor_name?: string
          requestor_url?: string | null
          result_endpoint_url?: string | null
          supported_brands?: string[]
          three_ri_enabled?: boolean
          threeds_method_url?: string | null
          updated_at?: string
          whitelisting_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "threeds_requestor_config_acs_merchant_id_fkey"
            columns: ["acs_merchant_id"]
            isOneToOne: false
            referencedRelation: "threeds_acs_merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      token_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          merchant_id: string | null
          metadata: Json | null
          token_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          merchant_id?: string | null
          metadata?: Json | null
          token_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          merchant_id?: string | null
          metadata?: Json | null
          token_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "token_events_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "token_events_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          customer_email: string | null
          description: string | null
          fx_rate: number | null
          id: string
          idempotency_key: string | null
          latency_ms: number | null
          merchant_id: string
          metadata: Json | null
          provider: string
          provider_ref: string | null
          settlement_amount: number | null
          settlement_currency: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency: string
          customer_email?: string | null
          description?: string | null
          fx_rate?: number | null
          id?: string
          idempotency_key?: string | null
          latency_ms?: number | null
          merchant_id: string
          metadata?: Json | null
          provider: string
          provider_ref?: string | null
          settlement_amount?: number | null
          settlement_currency?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          customer_email?: string | null
          description?: string | null
          fx_rate?: number | null
          id?: string
          idempotency_key?: string | null
          latency_ms?: number | null
          merchant_id?: string
          metadata?: Json | null
          provider?: string
          provider_ref?: string | null
          settlement_amount?: number | null
          settlement_currency?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      treasury_accounts: {
        Row: {
          balance: number | null
          created_at: string | null
          currency: string | null
          id: string
          liquidity_type: string
          merchant_id: string | null
          min_threshold: number | null
          provider: string | null
          region: string | null
          target_balance: number | null
          updated_at: string
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          liquidity_type?: string
          merchant_id?: string | null
          min_threshold?: number | null
          provider?: string | null
          region?: string | null
          target_balance?: number | null
          updated_at?: string
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          liquidity_type?: string
          merchant_id?: string | null
          min_threshold?: number | null
          provider?: string | null
          region?: string | null
          target_balance?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "treasury_accounts_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      treasury_bank_accounts: {
        Row: {
          account_holder: string | null
          account_number: string | null
          bank_name: string | null
          country: string | null
          created_at: string
          currency: string
          iban: string | null
          id: string
          label: string
          metadata: Json | null
          provider: string | null
          purpose: string
          routing_number: string | null
          sort_code: string | null
          status: string
          swift_bic: string | null
          updated_at: string
        }
        Insert: {
          account_holder?: string | null
          account_number?: string | null
          bank_name?: string | null
          country?: string | null
          created_at?: string
          currency?: string
          iban?: string | null
          id?: string
          label: string
          metadata?: Json | null
          provider?: string | null
          purpose: string
          routing_number?: string | null
          sort_code?: string | null
          status?: string
          swift_bic?: string | null
          updated_at?: string
        }
        Update: {
          account_holder?: string | null
          account_number?: string | null
          bank_name?: string | null
          country?: string | null
          created_at?: string
          currency?: string
          iban?: string | null
          id?: string
          label?: string
          metadata?: Json | null
          provider?: string | null
          purpose?: string
          routing_number?: string | null
          sort_code?: string | null
          status?: string
          swift_bic?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      treasury_movements: {
        Row: {
          amount: number
          converted_amount: number
          created_at: string
          from_currency: string
          fx_rate: number
          id: string
          initiated_by: string | null
          notes: string | null
          purpose: string
          status: string
          to_currency: string
        }
        Insert: {
          amount: number
          converted_amount?: number
          created_at?: string
          from_currency: string
          fx_rate?: number
          id?: string
          initiated_by?: string | null
          notes?: string | null
          purpose?: string
          status?: string
          to_currency: string
        }
        Update: {
          amount?: number
          converted_amount?: number
          created_at?: string
          from_currency?: string
          fx_rate?: number
          id?: string
          initiated_by?: string | null
          notes?: string | null
          purpose?: string
          status?: string
          to_currency?: string
        }
        Relationships: []
      }
      treasury_transfers: {
        Row: {
          amount: number | null
          created_at: string | null
          currency: string | null
          destination_pool: string | null
          id: string
          source_pool: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          destination_pool?: string | null
          id?: string
          source_pool?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          destination_pool?: string | null
          id?: string
          source_pool?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "treasury_transfers_destination_pool_fkey"
            columns: ["destination_pool"]
            isOneToOne: false
            referencedRelation: "liquidity_pools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treasury_transfers_source_pool_fkey"
            columns: ["source_pool"]
            isOneToOne: false
            referencedRelation: "liquidity_pools"
            referencedColumns: ["id"]
          },
        ]
      }
      treasury_wallets: {
        Row: {
          address: string | null
          asset: string
          available: number | null
          balance: number | null
          created_at: string
          external_wallet_id: string | null
          id: string
          label: string
          metadata: Json | null
          network: string | null
          provider: string
          updated_at: string
          yield_apr: number | null
          yield_provider: string | null
        }
        Insert: {
          address?: string | null
          asset: string
          available?: number | null
          balance?: number | null
          created_at?: string
          external_wallet_id?: string | null
          id?: string
          label: string
          metadata?: Json | null
          network?: string | null
          provider: string
          updated_at?: string
          yield_apr?: number | null
          yield_provider?: string | null
        }
        Update: {
          address?: string | null
          asset?: string
          available?: number | null
          balance?: number | null
          created_at?: string
          external_wallet_id?: string | null
          id?: string
          label?: string
          metadata?: Json | null
          network?: string | null
          provider?: string
          updated_at?: string
          yield_apr?: number | null
          yield_provider?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      webhook_deliveries: {
        Row: {
          attempt_count: number
          created_at: string
          delivered_at: string | null
          endpoint_id: string
          event_type: string
          id: string
          merchant_id: string
          payload: Json
          response_body: string | null
          response_status: number | null
          status: string
        }
        Insert: {
          attempt_count?: number
          created_at?: string
          delivered_at?: string | null
          endpoint_id: string
          event_type: string
          id?: string
          merchant_id: string
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          status?: string
        }
        Update: {
          attempt_count?: number
          created_at?: string
          delivered_at?: string | null
          endpoint_id?: string
          event_type?: string
          id?: string
          merchant_id?: string
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_deliveries_endpoint_id_fkey"
            columns: ["endpoint_id"]
            isOneToOne: false
            referencedRelation: "webhook_endpoints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_deliveries_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_endpoints: {
        Row: {
          active: boolean
          created_at: string
          events: string[]
          id: string
          merchant_id: string
          secret: string
          updated_at: string
          url: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          events?: string[]
          id?: string
          merchant_id: string
          secret?: string
          updated_at?: string
          url: string
        }
        Update: {
          active?: boolean
          created_at?: string
          events?: string[]
          id?: string
          merchant_id?: string
          secret?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_endpoints_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_events: {
        Row: {
          created_at: string | null
          event_type: string | null
          id: string
          payload: Json | null
        }
        Insert: {
          created_at?: string | null
          event_type?: string | null
          id?: string
          payload?: Json | null
        }
        Update: {
          created_at?: string | null
          event_type?: string | null
          id?: string
          payload?: Json | null
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          attempt_number: number | null
          created_at: string
          delivered_at: string | null
          event_type: string
          id: string
          merchant_id: string
          payload: Json | null
          response_body: string | null
          status_code: number | null
          url: string
        }
        Insert: {
          attempt_number?: number | null
          created_at?: string
          delivered_at?: string | null
          event_type: string
          id?: string
          merchant_id: string
          payload?: Json | null
          response_body?: string | null
          status_code?: number | null
          url: string
        }
        Update: {
          attempt_number?: number | null
          created_at?: string
          delivered_at?: string | null
          event_type?: string
          id?: string
          merchant_id?: string
          payload?: Json | null
          response_body?: string | null
          status_code?: number | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_notification_settings: {
        Row: {
          created_at: string | null
          email_address: string
          enabled: boolean | null
          id: string
          merchant_id: string | null
          notify_on_chargeback: boolean | null
          notify_on_failure: boolean | null
          notify_on_refund: boolean | null
          notify_on_success: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email_address: string
          enabled?: boolean | null
          id?: string
          merchant_id?: string | null
          notify_on_chargeback?: boolean | null
          notify_on_failure?: boolean | null
          notify_on_refund?: boolean | null
          notify_on_success?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email_address?: string
          enabled?: boolean | null
          id?: string
          merchant_id?: string | null
          notify_on_chargeback?: boolean | null
          notify_on_failure?: boolean | null
          notify_on_refund?: boolean | null
          notify_on_success?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_notification_settings_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_enki: { Args: { _user_id: string }; Returns: boolean }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_usage_count: { Args: { token_id: string }; Returns: undefined }
      log_security_alert: {
        Args: {
          _category: Database["public"]["Enums"]["alert_category"]
          _details?: Json
          _merchant_id?: string
          _message: string
          _severity: Database["public"]["Enums"]["alert_severity"]
          _source: string
        }
        Returns: string
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      alert_category:
        | "payment_failure"
        | "vgs_validation"
        | "webhook_signature"
        | "auth"
        | "rate_limit"
        | "other"
      alert_severity: "info" | "warn" | "critical"
      app_role:
        | "admin"
        | "moderator"
        | "user"
        | "merchant"
        | "reseller"
        | "super_admin"
        | "agent"
        | "investor"
        | "developer"
        | "secops"
        | "support"
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
      alert_category: [
        "payment_failure",
        "vgs_validation",
        "webhook_signature",
        "auth",
        "rate_limit",
        "other",
      ],
      alert_severity: ["info", "warn", "critical"],
      app_role: [
        "admin",
        "moderator",
        "user",
        "merchant",
        "reseller",
        "super_admin",
        "agent",
        "investor",
        "developer",
        "secops",
        "support",
      ],
    },
  },
} as const
