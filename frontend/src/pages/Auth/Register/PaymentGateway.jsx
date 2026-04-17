import { useAuth } from "@/contexts/AuthContext";
import { Loader2, CreditCard, Lock, CheckCircle } from "lucide-react";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function PaymentGateway() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const plan = searchParams.get("plan") || "Pro";
    
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        cardNumber: "",
        expiry: "",
        cvv: ""
    });

    const prices = { Basic: 0, Pro: 49, Enterprise: 199 };
    const price = prices[plan] || 49;

    const handlePayment = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        // Simulating Payment Gateway Delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        setSuccess(true);
        setLoading(false);
        
        // Simulating login and redirect
        setTimeout(async () => {
            try {
                const stored = localStorage.getItem("register");
                if(stored) {
                    const parsed = JSON.parse(stored);
                    const { email, password } = parsed;
                    if(login && email && password) {
                         await login(email, password);
                    }
                }
            } catch (err) {
                console.error("Login after payment failed", err);
            }
            navigate("/dashboard");
        }, 1500);
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center animate-in zoom-in-95 duration-500 fade-in">
                    <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle className="text-green-500 w-12 h-12" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Payment Successful!</h2>
                    <p className="text-gray-500 mb-6">Your subscription to the {plan} plan is confirmed. Welcome aboard!</p>
                    <div className="flex items-center justify-center text-sm text-gray-400 gap-2">
                        <Loader2 className="animate-spin w-4 h-4" />
                        Redirecting to dashboard...
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl w-full mx-auto grid lg:grid-cols-2 gap-12 items-start animate-in slide-in-from-bottom-8 fade-in duration-700">
                
                {/* Payment Form */}
                <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <CreditCard className="text-orange-500" />
                            Payment Method
                        </h2>
                        <p className="text-gray-500 mt-1">Enter your card details securely.</p>
                    </div>
                    
                    <form onSubmit={handlePayment} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name on Card</label>
                            <input 
                                required={price > 0}
                                type="text"
                                placeholder="John Doe"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all disabled:bg-gray-100 disabled:text-gray-400"
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                disabled={price === 0}
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                            <div className="relative">
                                <input 
                                    required={price > 0}
                                    type="text"
                                    placeholder="0000 0000 0000 0000"
                                    maxLength="19"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all disabled:bg-gray-100 disabled:text-gray-400"
                                    value={formData.cardNumber}
                                    onChange={e => {
                                        let val = e.target.value.replace(/\D/g, '');
                                        val = val.replace(/(.{4})/g, '$1 ').trim();
                                        setFormData({...formData, cardNumber: val});
                                    }}
                                    disabled={price === 0}
                                />
                                <CreditCard className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                                <input 
                                    required={price > 0}
                                    type="text"
                                    placeholder="MM/YY"
                                    maxLength="5"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all disabled:bg-gray-100 disabled:text-gray-400"
                                    value={formData.expiry}
                                    onChange={e => {
                                        let val = e.target.value.replace(/\D/g, '');
                                        if (val.length > 2) val = val.substring(0,2) + '/' + val.substring(2,4);
                                        setFormData({...formData, expiry: val});
                                    }}
                                    disabled={price === 0}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                                <input 
                                    required={price > 0}
                                    type="password"
                                    placeholder="123"
                                    maxLength="4"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all disabled:bg-gray-100 disabled:text-gray-400"
                                    value={formData.cvv}
                                    onChange={e => setFormData({...formData, cvv: e.target.value.replace(/\D/g, '')})}
                                    disabled={price === 0}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || (price > 0 && (!formData.cardNumber || !formData.expiry || !formData.cvv))}
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="animate-spin w-6 h-6" /> : (
                                <>
                                    <Lock size={18} />
                                    {price === 0 ? "Start Free Plan" : `Pay $${price}`}
                                </>
                            )}
                        </button>
                        <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1 mt-2">
                            <Lock size={12} /> Payments are secure and encrypted.
                        </p>
                    </form>
                </div>

                {/* Order Summary */}
                <div className="bg-gray-900 text-white rounded-3xl shadow-xl p-8 sticky top-12">
                    <h3 className="text-2xl font-bold mb-6">Order Summary</h3>
                    
                    <div className="space-y-4 mb-6 border-b border-gray-700 pb-6">
                        <div className="flex justify-between items-center text-gray-300">
                            <span>{plan} Plan (Monthly)</span>
                            <span className="font-semibold text-white">${price}.00</span>
                        </div>
                        <div className="flex justify-between items-center text-gray-300">
                            <span>Setup Fee</span>
                            <span className="font-semibold text-white">$0.00</span>
                        </div>
                    </div>
                    
                    <div className="flex justify-between items-center mb-8">
                        <span className="text-lg font-medium">Total</span>
                        <div className="text-right">
                            <span className="text-3xl font-bold text-orange-500">${price}.00</span>
                            <p className="text-sm text-gray-400">per month</p>
                        </div>
                    </div>
                    
                    <div className="bg-gray-800 rounded-xl p-4 text-sm text-gray-300">
                        <strong className="text-white block mb-1">Guaranteed Satisfaction</strong>
                        Change your plan or cancel at any time. We'll prorate your billing automatically.
                    </div>
                </div>

            </div>
        </div>
    );
}
