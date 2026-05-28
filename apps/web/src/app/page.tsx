import Link from 'next/link'
import { ArrowRight, Bot, TrendingUp, Shield, Zap, Users, BarChart3 } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-background-primary">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-8">
            <h1 className="text-5xl md:text-7xl font-bold">
              <span className="text-gradient">AI-Powered</span>
              <br />
              Crypto Trading Ecosystem
            </h1>
            <p className="text-xl md:text-2xl text-text-secondary max-w-3xl mx-auto">
              Trade smarter with advanced AI agents, automated bots, and real-time analytics. 
              Built for traders who demand the best.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link 
                href="/auth/register"
                className="px-8 py-4 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link 
                href="/auth/login"
                className="px-8 py-4 glass hover:bg-background-tertiary text-text-primary font-semibold rounded-lg transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">
            Everything You Need to Win
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Bot className="w-8 h-8" />}
              title="AI Trading Agents"
              description="15+ specialized AI agents analyzing market 24/7 - price prediction, sentiment analysis, whale tracking."
            />
            <FeatureCard
              icon={<Zap className="w-8 h-8" />}
              title="Automated Bots"
              description="Grid, DCA, Scalping, and Arbitrage bots working while you sleep. Set it and forget it."
            />
            <FeatureCard
              icon={<TrendingUp className="w-8 h-8" />}
              title="Real-time Analytics"
              description="Professional-grade charts, indicators, and portfolio tracking. Every data point you need."
            />
            <FeatureCard
              icon={<Users className="w-8 h-8" />}
              title="Copy Trading"
              description="Follow and copy successful traders automatically. Learn from the best."
            />
            <FeatureCard
              icon={<Shield className="w-8 h-8" />}
              title="Enterprise Security"
              description="Bank-level encryption, 2FA, and API key protection. Your assets are safe."
            />
            <FeatureCard
              icon={<BarChart3 className="w-8 h-8" />}
              title="Smart Signals"
              description="AI-generated trading signals with entry, exit, and risk management. High win rate."
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 bg-background-secondary">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <Stat number="500K+" label="Active Users" />
            <Stat number="$2.5B+" label="Trading Volume" />
            <Stat number="99.9%" label="Uptime" />
            <Stat number="<50ms" label="Execution Speed" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold">
            Ready to Trade Smarter?
          </h2>
          <p className="text-xl text-text-secondary">
            Join thousands of traders already using Quantum Hedge to maximize their profits.
          </p>
          <div className="flex gap-4 justify-center">
            <Link 
              href="/auth/register"
              className="px-8 py-4 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg transition-colors"
            >
              Start Trading Now
            </Link>
          </div>
          <p className="text-sm text-text-tertiary">
            Free tier available • No credit card required • Start in minutes
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-primary py-12 px-4">
        <div className="max-w-7xl mx-auto text-center text-text-secondary">
          <p>&copy; 2026 Quantum Hedge. All rights reserved.</p>
          <div className="flex gap-6 justify-center mt-4">
            <Link href="/docs" className="hover:text-text-primary transition-colors">
              Documentation
            </Link>
            <Link href="/about" className="hover:text-text-primary transition-colors">
              About
            </Link>
            <Link href="/contact" className="hover:text-text-primary transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { 
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="glass p-6 rounded-xl space-y-4 hover:bg-background-tertiary transition-colors">
      <div className="text-primary">
        {icon}
      </div>
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="text-text-secondary">{description}</p>
    </div>
  )
}

function Stat({ number, label }: { number: string; label: string }) {
  return (
    <div>
      <div className="text-4xl md:text-5xl font-bold text-primary mb-2">{number}</div>
      <div className="text-text-secondary">{label}</div>
    </div>
  )
}
