import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Smartphone, CheckCircle, X, CreditCard, Copy } from 'lucide-react';

interface UPIPaymentProps {
  amount: number;
  planName: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const UPIPayment: React.FC<UPIPaymentProps> = ({ amount, planName, onSuccess, onCancel }) => {
  const [copied, setCopied] = useState(false);
  
  // Replace with your actual merchant UPI ID
  const merchantVPA = "trustlayer@okaxis"; 
  const merchantName = "Crifolayer SaaS";
  
  const upiLink = `upi://pay?pa=${merchantVPA}&pn=${encodeURIComponent(merchantName)}&am=${amount}&tn=${encodeURIComponent(`Payment for ${planName}`)}&cu=INR`;

  const copyVPA = () => {
    navigator.clipboard.writeText(merchantVPA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="brutal-card bg-white max-w-md w-full animate-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8 border-b-4 border-black pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border-2 border-black bg-brutal-blue flex items-center justify-center">
              <CreditCard className="text-white" />
            </div>
            <h2 className="font-display text-xl uppercase tracking-tighter">Pay via UPI</h2>
          </div>
          <button onClick={onCancel} className="p-1 hover:bg-gray-100 border-2 border-black">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-8">
          
          <div className="text-center">
            <div className="text-[10px] font-black uppercase text-gray-400 mb-1">Amount to Pay</div>
            <div className="font-display text-5xl uppercase tracking-tighter">₹{amount}</div>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 border-4 border-black bg-white shadow-[8px_8px_0px_#000]">
              <QRCodeSVG value={upiLink} size={200} includeMargin={true} />
            </div>
            <p className="text-[10px] font-black uppercase text-center max-w-[200px]">
              Scan this QR code using any UPI app (GPay, PhonePe, Paytm)
            </p>
          </div>

          {/* VPA Info */}
          <div className="brutal-card bg-gray-50 flex items-center justify-between py-3">
             <div>
               <div className="text-[8px] font-black uppercase text-gray-400">Merchant UPI ID</div>
               <div className="text-xs font-black">{merchantVPA}</div>
             </div>
             <button 
               onClick={copyVPA}
               className="p-2 border-2 border-black bg-white hover:bg-brutal-yellow transition-colors"
             >
               {copied ? <CheckCircle size={16} className="text-green-600" /> : <Copy size={16} />}
             </button>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 gap-4">
             <a 
               href={upiLink}
               className="brutal-btn bg-brutal-blue text-white py-4 text-xs font-black uppercase flex items-center justify-center gap-3"
             >
               <Smartphone size={18} /> Open in UPI App
             </a>
             
             <button 
               onClick={onSuccess}
               className="brutal-btn bg-brutal-green py-4 text-xs font-black uppercase"
             >
               I've Made the Payment
             </button>
          </div>
          
          <p className="text-[8px] font-bold text-center text-gray-400 uppercase">
             Secure Transaction via Unified Payments Interface
          </p>
        </div>
      </div>
    </div>
  );
};
