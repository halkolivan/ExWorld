import { createClient } from "@supabase/supabase-js";

// Получаем переменные окружения из Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Создаем и экспортируем готовый клиент для работы с базой
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
