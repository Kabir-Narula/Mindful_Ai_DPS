'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ArrowLeft, Check, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'

// Types matching our schema/plan
type OnboardingData = {
    nickname: string
    ageGroup: string
    lifeStage: string
    communicationStyle: string
    hobbies: string[]
    currentWellbeing: number
    primaryGoals: string[]
}

const INITIAL_DATA: OnboardingData = {
    nickname: '',
    ageGroup: '',
    lifeStage: '',
    communicationStyle: '',
    hobbies: [],
    currentWellbeing: 5,
    primaryGoals: []
}

export function OnboardingWizard() {
    const router = useRouter()
    const [step, setStep] = useState(0)
    const [data, setData] = useState<OnboardingData>(INITIAL_DATA)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const updateData = (fields: Partial<OnboardingData>) => {
        setData(prev => ({ ...prev, ...fields }))
    }

    const handleNext = () => {
        if (step < 5) setStep(prev => prev + 1)
    }

    const handleBack = () => {
        if (step > 0) setStep(prev => prev - 1)
    }

    const handleSubmit = async () => {
        setIsSubmitting(true)
        try {
            const response = await fetch('/api/user/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })

            if (!response.ok) throw new Error('Failed to save profile')

            // Force a hard refresh to ensure server-side auth state updates
            // and we get the fresh dashboard layout
            window.location.href = '/dashboard'
        } catch (error) {
            console.error(error)
            // Show error toast here
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleSkip = async () => {
        setIsSubmitting(true)
        try {
            const response = await fetch('/api/onboarding/skip', {
                method: 'POST'
            })

            if (!response.ok) throw new Error('Failed to skip onboarding')

            window.location.href = '/dashboard'
        } catch (error) {
            console.error(error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const steps = [
        <WelcomeStep key="welcome" data={data} updateData={updateData} onNext={handleNext} onSkip={handleSkip} isSubmitting={isSubmitting} />,
        <AgeStageStep key="age" data={data} updateData={updateData} onNext={handleNext} onBack={handleBack} onSkip={handleSkip} isSubmitting={isSubmitting} />,
        <StyleStep key="style" data={data} updateData={updateData} onNext={handleNext} onBack={handleBack} onSkip={handleSkip} isSubmitting={isSubmitting} />,
        <HobbiesStep key="hobbies" data={data} updateData={updateData} onNext={handleNext} onBack={handleBack} onSkip={handleSkip} isSubmitting={isSubmitting} />,
        <WellbeingStep key="wellbeing" data={data} updateData={updateData} onNext={handleNext} onBack={handleBack} onSkip={handleSkip} isSubmitting={isSubmitting} />,
        <PreviewStep key="preview" data={data} onSubmit={handleSubmit} isSubmitting={isSubmitting} onBack={handleBack} />
    ]

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden">
                {/* Progress Bar */}
                <div className="h-2 bg-slate-100">
                    <motion.div
                        className="h-full bg-indigo-600"
                        initial={{ width: 0 }}
                        animate={{ width: `${((step + 1) / 6) * 100}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>

                <div className="p-8 min-h-[500px] flex flex-col">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="flex-1 flex flex-col"
                        >
                            {steps[step]}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
}

// --- Step Components ---

function WelcomeStep({ data, updateData, onNext, onSkip, isSubmitting }: any) {
    return (
        <div className="flex-1 flex flex-col justify-center space-y-8">
            <div className="space-y-4 text-center">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto text-indigo-600">
                    <Sparkles size={32} />
                </div>
                <h1 className="text-3xl font-bold text-slate-900">Hi! I'm MindfulAI.</h1>
                <p className="text-lg text-slate-600 max-w-md mx-auto">
                    I'm here to support your mental wellness journey. Let's get started - this will only take 2 minutes.
                </p>
            </div>

            <div className="space-y-4 max-w-sm mx-auto w-full">
                <label className="block text-sm font-medium text-slate-700">
                    What should I call you? (Optional)
                </label>
                <input
                    type="text"
                    value={data.nickname}
                    onChange={(e) => updateData({ nickname: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    placeholder="e.g. Alex"
                    autoFocus
                />
                <div className="space-y-2">
                    <button
                        onClick={onNext}
                        disabled={isSubmitting}
                        className="w-full py-3 px-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                        Continue <ArrowRight size={18} />
                    </button>
                    <button
                        onClick={onSkip}
                        disabled={isSubmitting}
                        className="w-full py-2 text-slate-500 hover:text-slate-700 font-medium text-sm disabled:opacity-50"
                    >
                        Skip for now
                    </button>
                </div>
            </div>
        </div>
    )
}

function AgeStageStep({ data, updateData, onNext, onBack, onSkip, isSubmitting }: any) {
    const ageGroups = [
        { id: 'under-18', label: 'Under 18', desc: 'Navigating school & family' },
        { id: '18-24', label: '18-24', desc: 'Young Adult / Student' },
        { id: '25-34', label: '25-34', desc: 'Early Career / Building' },
        { id: '35-44', label: '35-44', desc: 'Established / Balancing' },
        { id: '45-54', label: '45-54', desc: 'Midlife / Transition' },
        { id: '55+', label: '55+', desc: 'Later Life / Wisdom' }
    ]

    const lifeStages = [
        'Student', 'Working Full-time', 'Working & Studying', 'Between Jobs', 'Retired', 'Other'
    ]

    const isValid = data.ageGroup && data.lifeStage

    return (
        <div className="flex-1 flex flex-col space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-900">Help me understand your context</h2>
                <p className="text-slate-600">This helps me give advice that actually fits your life.</p>
            </div>

            <div className="space-y-6">
                <div className="space-y-3">
                    <label className="text-sm font-medium text-slate-700">How old are you?</label>
                    <div className="grid grid-cols-2 gap-3">
                        {ageGroups.map((group) => (
                            <button
                                key={group.id}
                                onClick={() => updateData({ ageGroup: group.id })}
                                className={`p-3 rounded-lg border text-left transition-all ${data.ageGroup === group.id
                                        ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600'
                                        : 'border-slate-200 hover:border-indigo-300'
                                    }`}
                            >
                                <div className="font-medium text-slate-900">{group.label}</div>
                                <div className="text-xs text-slate-500">{group.desc}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {data.ageGroup && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3"
                    >
                        <label className="text-sm font-medium text-slate-700">Current Status</label>
                        <div className="flex flex-wrap gap-2">
                            {lifeStages.map((stage) => (
                                <button
                                    key={stage}
                                    onClick={() => updateData({ lifeStage: stage })}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${data.lifeStage === stage
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    {stage}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>

            <div className="space-y-2 pt-4 mt-auto">
                <div className="flex justify-between">
                    <button onClick={onBack} className="text-slate-500 hover:text-slate-800 font-medium">Back</button>
                    <button
                        onClick={onNext}
                        disabled={!isValid || isSubmitting}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                        Continue
                    </button>
                </div>
                <button
                    onClick={onSkip}
                    disabled={isSubmitting}
                    className="w-full py-2 text-slate-400 hover:text-slate-600 text-sm font-medium disabled:opacity-50"
                >
                    Skip for now
                </button>
            </div>
        </div>
    )
}

function StyleStep({ data, updateData, onNext, onBack, onSkip, isSubmitting }: any) {
    const styles = [
        { id: 'casual', icon: '🤙', label: 'Casual & Friendly', desc: 'Like texting a supportive friend. No jargon.' },
        { id: 'conversational', icon: '☕', label: 'Warm & Conversational', desc: 'Like a coffee chat with a wise mentor.' },
        { id: 'reflective', icon: '🤔', label: 'Deep & Reflective', desc: 'Thoughtful questions that make you think.' },
        { id: 'direct', icon: '🎯', label: 'Direct & Action-Oriented', desc: 'Straight to the point. Solution focused.' }
    ]

    return (
        <div className="flex-1 flex flex-col space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-900">How should I talk to you?</h2>
                <p className="text-slate-600">Everyone processes emotions differently.</p>
            </div>

            <div className="space-y-3">
                {styles.map((style) => (
                    <button
                        key={style.id}
                        onClick={() => updateData({ communicationStyle: style.id })}
                        className={`w-full p-4 rounded-xl border text-left transition-all flex items-center gap-4 ${data.communicationStyle === style.id
                                ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600'
                                : 'border-slate-200 hover:border-indigo-300'
                            }`}
                    >
                        <span className="text-2xl">{style.icon}</span>
                        <div>
                            <div className="font-medium text-slate-900">{style.label}</div>
                            <div className="text-sm text-slate-500">{style.desc}</div>
                        </div>
                        {data.communicationStyle === style.id && (
                            <Check className="ml-auto text-indigo-600" size={20} />
                        )}
                    </button>
                ))}
            </div>

            <div className="space-y-2 pt-4 mt-auto">
                <div className="flex justify-between">
                    <button onClick={onBack} className="text-slate-500 hover:text-slate-800 font-medium">Back</button>
                    <button
                        onClick={onNext}
                        disabled={!data.communicationStyle || isSubmitting}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                        Continue
                    </button>
                </div>
                <button
                    onClick={onSkip}
                    disabled={isSubmitting}
                    className="w-full py-2 text-slate-400 hover:text-slate-600 text-sm font-medium disabled:opacity-50"
                >
                    Skip for now
                </button>
            </div>
        </div>
    )
}

function HobbiesStep({ data, updateData, onNext, onBack, onSkip, isSubmitting }: any) {
    const hobbiesList = [
        'Gaming 🎮', 'Creative Arts 🎨', 'Sports/Fitness 🏃‍♂️', 'Reading/Learning 📚',
        'Movies/TV 🎬', 'Socializing 👥', 'Mindfulness 🧘‍♀️', 'Tech/Coding 💻',
        'Cooking 🍳', 'Music 🎵', 'Nature 🌲', 'Travel ✈️'
    ]

    const toggleHobby = (hobby: string) => {
        const current = data.hobbies
        const cleanHobby = hobby.split(' ')[0].toLowerCase() // Store simple key

        if (current.includes(cleanHobby)) {
            updateData({ hobbies: current.filter((h: string) => h !== cleanHobby) })
        } else {
            if (current.length < 3) {
                updateData({ hobbies: [...current, cleanHobby] })
            }
        }
    }

    return (
        <div className="flex-1 flex flex-col space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-900">What do you enjoy?</h2>
                <p className="text-slate-600">Pick up to 3. I'll use these to make my advice relatable.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {hobbiesList.map((hobby) => {
                    const cleanKey = hobby.split(' ')[0].toLowerCase()
                    const isSelected = data.hobbies.includes(cleanKey)
                    return (
                        <button
                            key={hobby}
                            onClick={() => toggleHobby(hobby)}
                            className={`p-3 rounded-lg border text-center transition-all ${isSelected
                                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-medium'
                                    : 'border-slate-200 hover:border-indigo-300 text-slate-700'
                                }`}
                        >
                            {hobby}
                        </button>
                    )
                })}
            </div>

            <div className="space-y-2 pt-4 mt-auto">
                <div className="flex justify-between">
                    <button onClick={onBack} className="text-slate-500 hover:text-slate-800 font-medium">Back</button>
                    <button
                        onClick={onNext}
                        disabled={data.hobbies.length === 0 || isSubmitting}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                        Continue
                    </button>
                </div>
                <button
                    onClick={onSkip}
                    disabled={isSubmitting}
                    className="w-full py-2 text-slate-400 hover:text-slate-600 text-sm font-medium disabled:opacity-50"
                >
                    Skip for now
                </button>
            </div>
        </div>
    )
}

function WellbeingStep({ data, updateData, onNext, onBack, onSkip, isSubmitting }: any) {
    const goals = [
        'Reduce Anxiety 😰', 'Improve Mood 😔', 'Build Habits 📅',
        'Gain Clarity 💭', 'Boost Confidence 💪', 'Vent/Talk 🗣️'
    ]

    const toggleGoal = (goal: string) => {
        const current = data.primaryGoals
        if (current.includes(goal)) {
            updateData({ primaryGoals: current.filter((g: string) => g !== goal) })
        } else {
            updateData({ primaryGoals: [...current, goal] })
        }
    }

    return (
        <div className="flex-1 flex flex-col space-y-8">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-900">How are you doing lately?</h2>
                <p className="text-slate-600">This helps me know where to start.</p>
            </div>

            <div className="space-y-6">
                <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium text-slate-600">
                        <span>Struggling</span>
                        <span>Thriving</span>
                    </div>
                    <input
                        type="range"
                        min="1"
                        max="10"
                        value={data.currentWellbeing}
                        onChange={(e) => updateData({ currentWellbeing: parseInt(e.target.value) })}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <div className="text-center font-bold text-indigo-600 text-xl">
                        {data.currentWellbeing}/10
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-sm font-medium text-slate-700">What brings you here? (Select all that apply)</label>
                    <div className="flex flex-wrap gap-2">
                        {goals.map((goal) => (
                            <button
                                key={goal}
                                onClick={() => toggleGoal(goal)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${data.primaryGoals.includes(goal)
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                {goal}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="space-y-2 pt-4 mt-auto">
                <div className="flex justify-between">
                    <button onClick={onBack} className="text-slate-500 hover:text-slate-800 font-medium">Back</button>
                    <button
                        onClick={onNext}
                        disabled={data.primaryGoals.length === 0 || isSubmitting}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                        Continue
                    </button>
                </div>
                <button
                    onClick={onSkip}
                    disabled={isSubmitting}
                    className="w-full py-2 text-slate-400 hover:text-slate-600 text-sm font-medium disabled:opacity-50"
                >
                    Skip for now
                </button>
            </div>
        </div>
    )
}

function PreviewStep({ data, onSubmit, isSubmitting, onBack }: any) {
    return (
        <div className="flex-1 flex flex-col space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-900">Ready to meet your companion?</h2>
                <p className="text-slate-600">Here's what I know about you so far:</p>
            </div>

            <div className="bg-slate-50 rounded-xl p-6 space-y-4 border border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                        👤
                    </div>
                    <div>
                        <div className="font-medium text-slate-900">{data.nickname}</div>
                        <div className="text-sm text-slate-500">{data.ageGroup} • {data.lifeStage}</div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                        💬
                    </div>
                    <div>
                        <div className="font-medium text-slate-900">Communication Style</div>
                        <div className="text-sm text-slate-500 capitalize">{data.communicationStyle}</div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                        🎮
                    </div>
                    <div>
                        <div className="font-medium text-slate-900">Interests</div>
                        <div className="text-sm text-slate-500 capitalize">{data.hobbies.join(', ')}</div>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                <p className="text-center text-sm text-slate-600">
                    Based on this, I'll adapt my personality to be the perfect support for <strong>YOU</strong>.
                </p>
                <button
                    onClick={onSubmit}
                    disabled={isSubmitting}
                    className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 disabled:opacity-70 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                >
                    {isSubmitting ? 'Setting up...' : 'Let\'s Begin Journey ✨'}
                </button>
                <button onClick={onBack} className="w-full py-2 text-slate-500 hover:text-slate-800 font-medium">
                    Back
                </button>
            </div>
        </div>
    )
}
