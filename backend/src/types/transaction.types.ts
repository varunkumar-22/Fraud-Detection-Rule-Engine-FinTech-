// Transaction types — matches transactions table schema

export interface Transaction {
  tx_id: string;
  user_id: string;
  amount: number;
  location: string;
  device_id: string;
  transaction_time: Date;
  is_simulation: boolean;
  created_at: Date;
}

// Input shape for incoming API requests (before tx_id and created_at are assigned)
export interface TransactionInput {
  user_id: string;
  amount: number;
  location: string;
  device_id: string;
  transaction_time?: string; // ISO string, defaults to now if not provided
  is_simulation?: boolean;   // defaults to false
}
