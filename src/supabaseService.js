import { supabase } from './supabase.js';

// ===== WEIGHT HISTORY =====
export const saveWeightToSupabase = async (userId, weight, note = '') => {
    const { data, error } = await supabase
        .from('weight_history')
        .insert([{
            user_id: userId,
            weight: parseFloat(weight),
            note: note,
            date: new Date().toISOString()
        }])
        .select()
        .single();
    
    if (error) throw error;
    return data;
};

export const getWeightHistory = async (userId) => {
    const { data, error } = await supabase
        .from('weight_history')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: true });
    
    if (error) throw error;
    return data;
};

// ===== PROGRESS PHOTOS =====
export const savePhotoToSupabase = async (userId, photoUrl, weight) => {
    const { data, error } = await supabase
        .from('progress_photos')
        .insert([{
            user_id: userId,
            photo_url: photoUrl,
            weight: parseFloat(weight),
            date: new Date().toISOString()
        }])
        .select()
        .single();
    
    if (error) throw error;
    return data;
};

export const getProgressPhotos = async (userId) => {
    const { data, error } = await supabase
        .from('progress_photos')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });
    
    if (error) throw error;
    return data;
};

// ===== MEAL COMPLETIONS =====
export const toggleMealCompletion = async (userId, foodId) => {
    const today = new Date().toISOString().split('T')[0]; // "2026-01-23"
    
    // Verificar se já existe
    const { data: existing } = await supabase
        .from('meal_completions')
        .select('*')
        .eq('user_id', userId)
        .eq('food_id', foodId)
        .eq('completed_at', today)
        .single();
    
    if (existing) {
        // Se existe, deletar (desmarcar)
        const { error } = await supabase
            .from('meal_completions')
            .delete()
            .eq('id', existing.id);
        
        if (error) throw error;
        return { action: 'removed' };
    } else {
        // Se não existe, criar (marcar)
        const { data, error } = await supabase
            .from('meal_completions')
            .insert([{
                user_id: userId,
                food_id: foodId,
                completed_at: today
            }])
            .select()
            .single();
        
        if (error) throw error;
        return { action: 'added', data };
    }
};

export const getTodayMealCompletions = async (userId) => {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
        .from('meal_completions')
        .select('food_id')
        .eq('user_id', userId)
        .eq('completed_at', today);
    
    if (error) throw error;
    return data.map(item => item.food_id); // Retorna array: ['f1', 'f5', ...]
};

// ===== WORKOUT COMPLETIONS =====
export const toggleWorkoutCompletion = async (userId, workoutId, caloriesBurned = null) => {
    const today = new Date().toISOString().split('T')[0];
    
    const { data: existing } = await supabase
        .from('workout_completions')
        .select('*')
        .eq('user_id', userId)
        .eq('workout_id', workoutId)
        .eq('completed_at', today)
        .single();
    
    if (existing) {
        const { error } = await supabase
            .from('workout_completions')
            .delete()
            .eq('id', existing.id);
        
        if (error) throw error;
        return { action: 'removed' };
    } else {
        const { data, error } = await supabase
            .from('workout_completions')
            .insert([{
                user_id: userId,
                workout_id: workoutId,
                calories_burned: caloriesBurned,
                completed_at: today
            }])
            .select()
            .single();
        
        if (error) throw error;
        return { action: 'added', data };
    }
};

export const getTodayWorkoutCompletions = async (userId) => {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
        .from('workout_completions')
        .select('*')
        .eq('user_id', userId)
        .eq('completed_at', today);
    
    if (error) throw error;
    return data;
};

// ===== CUSTOM MEAL PLANS =====
export const saveMealPlan = async (userId, mealData, nutritionGoals) => {
    // Verificar se usuário já tem plano
    const { data: existing } = await supabase
        .from('custom_meal_plans')
        .select('*')
        .eq('user_id', userId)
        .single();
    
    if (existing) {
        // Atualizar
        const { data, error } = await supabase
            .from('custom_meal_plans')
            .update({
                meal_data: mealData,
                nutrition_goals: nutritionGoals,
                updated_at: new Date().toISOString()
            })
            .eq('id', existing.id)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    } else {
        // Criar novo
        const { data, error } = await supabase
            .from('custom_meal_plans')
            .insert([{
                user_id: userId,
                meal_data: mealData,
                nutrition_goals: nutritionGoals
            }])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }
};

export const getMealPlan = async (userId) => {
    const { data, error } = await supabase
        .from('custom_meal_plans')
        .select('*')
        .eq('user_id', userId)
        .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
};

// ===== CUSTOM WORKOUT PLANS =====
export const saveWorkoutPlan = async (userId, workoutData) => {
    const { data: existing } = await supabase
        .from('custom_workout_plans')
        .select('*')
        .eq('user_id', userId)
        .single();
    
    if (existing) {
        const { data, error } = await supabase
            .from('custom_workout_plans')
            .update({
                workout_data: workoutData,
                updated_at: new Date().toISOString()
            })
            .eq('id', existing.id)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    } else {
        const { data, error } = await supabase
            .from('custom_workout_plans')
            .insert([{
                user_id: userId,
                workout_data: workoutData
            }])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }
};

export const getWorkoutPlan = async (userId) => {
    const { data, error } = await supabase
        .from('custom_workout_plans')
        .select('*')
        .eq('user_id', userId)
        .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
};

// ===== NOTIFICATIONS =====
export const saveNotification = async (userId, notification) => {
    const { data, error } = await supabase
        .from('notifications')
        .insert([{
            user_id: userId,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            icon: notification.icon
        }])
        .select()
        .single();
    
    if (error) throw error;
    return data;
};

export const getNotifications = async (userId) => {
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
    
    if (error) throw error;
    return data;
};

export const markNotificationAsRead = async (notificationId) => {
    const { data, error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .select()
        .single();
    
    if (error) throw error;
    return data;
};