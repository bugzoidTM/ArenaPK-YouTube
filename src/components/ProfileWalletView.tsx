/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Wallet, CreditCard, ChevronRight, Check, AlertCircle, ShoppingBag, ArrowUpRight, ArrowDownLeft, ShieldCheck, QrCode, AlertTriangle, Gift } from 'lucide-react';
import { MarketCoinPack } from '../types';
import { COIN_PACKS } from '../services/pkService';
import { paymentService, GiftTransaction } from '../services/paymentService';

interface ProfileWalletViewProps {
  userCoins: number;
  onCoinsChange: (newValue: number) => void;
  creatorEarningsBRL: number;
  onEarningsChange: (newValue: number) => void;
}

export default function ProfileWalletView({
  userCoins,
  onCoinsChange,
  creatorEarningsBRL,
  onEarningsChange,
}: ProfileWalletViewProps) {
  const [activeTab, setActiveTab] = useState<'buy' | 'payout' | 'history'>('buy');
  
  // Gift history states
  const [sentTransactions, setSentTransactions] = useState<GiftTransaction[]>(() => paymentService.getSentTransactions());
  const [receivedTransactions, setReceivedTransactions] = useState<GiftTransaction[]>(() => paymentService.getReceivedTransactions());

  // Coin checkout simulation
  const [checkoutPack, setCheckoutPack] = useState<MarketCoinPack | null>(null);
  const [payMethod, setPayMethod] = useState<'pix' | 'cc'>('pix');
  const [pixCopied, setPixCopied] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [isProcessingBuy, setIsProcessingBuy] = useState(false);

  // Sync gift history on coins change
  useEffect(() => {
    setSentTransactions(paymentService.getSentTransactions());
    setReceivedTransactions(paymentService.getReceivedTransactions());
  }, [userCoins, creatorEarningsBRL]);

  // Creator Payout state
  const [payoutAmount, setPayoutAmount] = useState('250.00');
  const [pixKey, setPixKey] = useState('');
  const [pixKeyType, setPixKeyType] = useState('cpf');
  const [isProcessingPayout, setIsProcessingPayout] = useState(false);
  const [payoutLogs, setPayoutLogs] = useState<Array<{ id: string; amount: number; key: string; status: string; date: string }>>([
    { id: 'tx-1004', amount: 350.00, key: 'elenilton***@gmail.com', status: 'completed', date: '28/05/2026' },
    { id: 'tx-1003', amount: 80.00, key: '023.***.***-20', status: 'completed', date: '15/05/2026' }
  ]);

  const handlePurchaseComplete = async () => {
    if (!checkoutPack) return;
    
    setIsProcessingBuy(true);
    try {
      const packTotalCoins = checkoutPack.coins + checkoutPack.bonus;
      const checkoutRes = await paymentService.createCheckout(checkoutPack, payMethod);
      if (checkoutRes.success) {
        const confirmRes = await paymentService.confirmPayment(checkoutRes.checkoutId, packTotalCoins);
        if (confirmRes.success) {
          setIsProcessingBuy(false);
          onCoinsChange(paymentService.getCoins());
          alert(`Sucesso! Foram creditadas ${packTotalCoins.toLocaleString()} moedas na sua carteira.`);
          setCheckoutPack(null);
          setPixCopied(false);
          setCardNumber('');
          setCardHolder('');
        }
      }
    } catch (err) {
      setIsProcessingBuy(false);
      console.error(err);
      alert('Houve um erro simulado no processamento do pagamento.');
    }
  };

  const handlePayoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const withdrawValue = parseFloat(payoutAmount);

    if (isNaN(withdrawValue) || withdrawValue <= 0) {
      alert('Por favor, informe um valor de saque válido.');
      return;
    }

    if (withdrawValue > creatorEarningsBRL) {
      alert('Saldo de ganhos insuficiente para realizar este saque.');
      return;
    }

    if (withdrawValue < 50) {
      alert('O valor mínimo para saques de saldo é R$ 50,00.');
      return;
    }

    setIsProcessingPayout(true);
    setTimeout(() => {
      setIsProcessingPayout(false);
      onEarningsChange(creatorEarningsBRL - withdrawValue);
      
      const newLog = {
        id: `tx-${Math.floor(Math.random() * 9000) + 1000}`,
        amount: withdrawValue,
        key: pixKey,
        status: 'completed',
        date: new Date().toLocaleDateString('pt-BR')
      };
      
      setPayoutLogs(prev => [newLog, ...prev]);
      alert(`Seu saque de R$ ${withdrawValue.toFixed(2)} foi processado e enviado para sua chave Pix com sucesso!`);
      setPixKey('');
    }, 2000);
  };

  const handleCopyPix = () => {
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto py-6 pb-20 space-y-8 relative z-10">
      
      {/* Upper overview card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* VIEWERS WALLET */}
        <div className="p-6 rounded-2xl bg-zinc-900/60 border border-white/10 backdrop-blur-md shadow-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider block font-mono">Torcedor / Espectador</span>
            <span className="text-zinc-400 text-xs block">Seu saldo de Moedas para presentes:</span>
            <span className="text-3xl font-black text-white font-mono mt-2 block">
              🪙 {userCoins.toLocaleString()}
            </span>
          </div>
          <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center border border-amber-500/20 shadow-inner">
            <Wallet className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        {/* CREATORS EARNINGS */}
        <div className="p-6 rounded-2xl bg-zinc-900/60 border border-white/10 backdrop-blur-md shadow-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-emerald-450 font-bold uppercase tracking-wider block font-mono">Criador de Conteúdo</span>
            <span className="text-zinc-400 text-xs block">Seu saldo disponível para saque:</span>
            <span className="text-3xl font-black text-white font-mono mt-2 block">
              R$ {creatorEarningsBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-450 rounded-xl flex items-center justify-center border border-emerald-500/20 shadow-inner">
            <ArrowUpRight className="w-6 h-6 text-emerald-500" />
          </div>
        </div>

      </div>

      {/* Tabs */}
      <div className="flex flex-wrap border-b border-white/10 select-none">
        <button
          onClick={() => { setActiveTab('buy'); setCheckoutPack(null); }}
          className={`flex-1 min-w-[150px] py-3.5 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border-b-2 uppercase tracking-wider ${
            activeTab === 'buy' ? 'border-amber-500 text-white bg-white/5' : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <ShoppingBag className="w-4 h-4 text-amber-500" />
          Comprar Moedas (Torcedor)
        </button>
        <button
          onClick={() => { setActiveTab('history'); setCheckoutPack(null); }}
          className={`flex-1 min-w-[150px] py-3.5 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border-b-2 uppercase tracking-wider ${
            activeTab === 'history' ? 'border-rose-500 text-white bg-white/5' : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <Gift className="w-4 h-4 text-rose-550" />
          Histórico de Presentes
        </button>
        <button
          onClick={() => { setActiveTab('payout'); setCheckoutPack(null); }}
          className={`flex-1 min-w-[150px] py-3.5 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border-b-2 uppercase tracking-wider ${
            activeTab === 'payout' ? 'border-emerald-500 text-white bg-white/5' : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <ArrowUpRight className="w-4 h-4 text-emerald-500" />
          Resgatar Ganhos / Saques (Criador)
        </button>
      </div>

      {/* Buy coins flow */}
      {activeTab === 'buy' && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h3 className="text-lg font-black text-white uppercase italic tracking-tight">Adquira Moedas de Apoio</h3>
            <p className="text-xs text-zinc-400 font-sans">Troque as moedas por presentes interativos coloridos para lançar na tela durante batalhas PK.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {COIN_PACKS.map((pack) => (
              <div
                key={pack.id}
                className={`p-5 bg-zinc-900/40 border rounded-2xl relative flex flex-col justify-between space-y-4 group transition-all backdrop-blur-md ${
                  pack.popular ? 'border-amber-500/80 shadow-[0_4px_25px_rgba(245,158,11,0.08)] bg-gradient-to-b from-zinc-900 via-zinc-900 to-amber-950/20' : 'border-white/10 hover:border-white/20'
                }`}
              >
                {pack.popular && (
                  <span className="absolute -top-3 left-4 bg-amber-500 text-zinc-950 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">
                    Mais Popular⭐
                  </span>
                )}

                <div className="space-y-1.5">
                  <span className="text-2xl block select-none">🪙</span>
                  <p className="text-xl font-extrabold text-white">
                    {pack.coins.toLocaleString()} Moedas
                  </p>
                  {pack.bonus > 0 && (
                    <span className="text-[10px] text-amber-450 font-bold bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20 uppercase font-mono inline-block">
                      + {pack.bonus} Moedas Bônus
                    </span>
                  )}
                </div>

                <div className="pt-3.5 flex items-center justify-between border-t border-white/5">
                  <span className="text-sm font-bold text-zinc-300 font-mono">
                    R$ {pack.priceBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  
                  <button
                    onClick={() => setCheckoutPack(pack)}
                    className="px-4 py-2 font-black uppercase tracking-wider text-[10px] bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-lg transition duration-150 cursor-pointer shadow-md"
                  >
                    Recarregar
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Checkout modal simulator popup */}
          {checkoutPack && (
            <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in">
              <div className="bg-zinc-900 border border-white/10 max-w-md w-full rounded-2xl overflow-hidden shadow-2xl">
                
                {/* Modal Header */}
                <div className="p-5 bg-zinc-950 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-amber-400" />
                    <div>
                      <h4 className="font-extrabold text-white text-sm">Checkout Sincronizado</h4>
                      <p className="text-[9px] text-zinc-500 uppercase font-mono">Gateway de Simulação</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setCheckoutPack(null)}
                    className="text-zinc-400 hover:text-white text-xs cursor-pointer px-2 py-0.5"
                  >
                    Fechar [X]
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-5 space-y-6">
                  
                  {/* Pack Review */}
                  <div className="p-3 bg-zinc-950 rounded-xl space-y-1.5 border border-white/5">
                    <div className="flex justify-between font-bold text-xs">
                      <span className="text-white">🪙 {checkoutPack.coins + checkoutPack.bonus} Moedas de Apoio</span>
                      <span className="text-amber-450 font-mono">R$ {checkoutPack.priceBRL.toFixed(2)}</span>
                    </div>
                    <p className="text-[10px] text-zinc-500">Adquirido via ArenaPK Soluções Digitais</p>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="flex gap-2 select-none">
                    <button
                      type="button"
                      onClick={() => setPayMethod('pix')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg border transition cursor-pointer flex items-center justify-center gap-1 ${
                        payMethod === 'pix' ? 'bg-amber-500/10 border-amber-500 text-amber-450' : 'bg-zinc-950 border-white/10 text-zinc-400'
                      }`}
                    >
                      <span>⚡</span> Pix Instantâneo
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayMethod('cc')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        payMethod === 'cc' ? 'bg-amber-500/10 border-amber-500 text-amber-450' : 'bg-zinc-950 border-white/10 text-zinc-400'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" /> Cartão Crédito
                    </button>
                  </div>

                  {/* PIX Form */}
                  {payMethod === 'pix' && (
                    <div className="space-y-4 text-center">
                      <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 mx-auto flex flex-col items-center max-w-[200px]">
                        <QrCode className="w-28 h-28 text-white filter drop-shadow" />
                        <p className="text-[8px] text-zinc-500 uppercase mt-2 font-mono">QRCode Estático Comercial</p>
                      </div>

                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={handleCopyPix}
                          className="w-full py-2 bg-zinc-950 hover:bg-zinc-900 text-zinc-300 text-xs font-semibold rounded-lg border border-white/10 transition-colors"
                        >
                          {pixCopied ? '✓ Copiado com sucesso!' : 'Copiar Chave Copia e Cola'}
                        </button>
                        <p className="text-[10px] text-zinc-500 font-sans">Pague no seu banco e clique em confirmar abaixo.</p>
                      </div>
                    </div>
                  )}

                  {/* Credit Card Form */}
                  {payMethod === 'cc' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] text-zinc-400 uppercase font-bold mb-1 font-mono tracking-wider">Número do Cartão (Simulado)</label>
                        <input
                          type="text"
                          required
                          placeholder="4556 **** **** 9081"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          className="w-full bg-zinc-950 text-white rounded-lg border border-white/10 px-3 py-2 text-xs focus:outline-none focus:border-amber-500 transition-colors"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-zinc-400 uppercase font-bold mb-1 font-mono tracking-wider">Validade</label>
                          <input
                            type="text"
                            placeholder="12/28"
                            className="w-full bg-zinc-950 text-white rounded-lg border border-white/10 px-3 py-2 text-xs focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-zinc-400 uppercase font-bold mb-1 font-mono tracking-wider">CVV</label>
                          <input
                            type="text"
                            placeholder="991"
                            className="w-full bg-zinc-950 text-white rounded-lg border border-white/10 px-3 py-2 text-xs focus:outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] text-zinc-400 uppercase font-bold mb-1 font-mono tracking-wider">Nome no Cartão</label>
                        <input
                          type="text"
                          required
                          placeholder="ELI BARRETO FREITAS"
                          value={cardHolder}
                          onChange={(e) => setCardHolder(e.target.value)}
                          className="w-full bg-zinc-950 text-white rounded-lg border border-white/10 px-3 py-2 text-xs focus:outline-none focus:border-amber-500 transition-colors"
                        />
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-white/5 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setCheckoutPack(null)}
                      className="flex-1 py-3 bg-zinc-950 hover:bg-zinc-900 border border-white/10 text-zinc-400 font-bold text-xs rounded-xl transition"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handlePurchaseComplete}
                      disabled={isProcessingBuy}
                      className="flex-[2] py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-800 text-zinc-950 font-black uppercase tracking-wider text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition"
                    >
                      {isProcessingBuy ? (
                        <span className="w-4 h-4 rounded-full border-2 border-zinc-950/20 border-t-zinc-950 animate-spin" />
                      ) : 'Confirmar Pagamento'}
                    </button>
                  </div>

                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Gift History segment listing sent and received records with detailed indicators */}
      {activeTab === 'history' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start relative z-10 animate-fade-in">
          
          {/* Senders Tab - Sent Gifts */}
          <div className="bg-zinc-900/60 border border-white/10 p-6 rounded-2xl space-y-4 backdrop-blur-md shadow-2xl">
            <h3 className="text-xs font-black text-white uppercase tracking-widest border-b border-white/10 pb-3 flex items-center justify-between select-none">
              <span className="flex items-center gap-1.5">
                <ArrowUpRight className="w-4 h-4 text-rose-500" />
                Presentes Enviados (Você)
              </span>
              <span className="text-[9px] font-mono bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded border border-rose-500/20">
                Torcedor
              </span>
            </h3>

            {sentTransactions.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-white/5 bg-zinc-950/20 rounded-xl space-y-2">
                <span className="text-2xl">🎁</span>
                <p className="text-xs text-zinc-500">Nenhum presente enviado ainda.</p>
                <button
                  onClick={() => setActiveTab('buy')}
                  className="px-4 py-1.5 text-[10px] uppercase tracking-wider font-black text-rose-500 hover:text-white"
                >
                  Adquirir Moedas
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {sentTransactions.map((tx) => (
                  <div key={tx.id} className="p-3 bg-zinc-950/60 border border-white/5 rounded-xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl filter drop-shadow select-none">{tx.giftIcon}</span>
                      <div>
                        <span className="text-xs font-bold text-white block font-sans">{tx.giftName}</span>
                        <span className="text-[10px] text-zinc-500 block">Para: {tx.creatorName}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-amber-500 block">🪙 {tx.coinValue.toLocaleString()}</span>
                      <span className="text-[9px] text-zinc-600 block mt-0.5 font-mono">{tx.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Connected Creator Tab - Received Gifts */}
          <div className="bg-zinc-900/60 border border-white/10 p-6 rounded-2xl space-y-4 backdrop-blur-md shadow-2xl">
            <h3 className="text-xs font-black text-white uppercase tracking-widest border-b border-white/10 pb-3 flex items-center justify-between select-none">
              <span className="flex items-center gap-1.5">
                <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
                Presentes Recebidos (Sua Conta)
              </span>
              <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-450 px-2 py-0.5 rounded border border-emerald-500/20">
                Ganhos de Live
              </span>
            </h3>

            {receivedTransactions.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-white/5 bg-zinc-950/20 rounded-xl space-y-2">
                <span className="text-2xl">🏆</span>
                <p className="text-xs text-zinc-500">Nenhum presente recebido nesta conta.</p>
                <p className="text-[9px] text-zinc-600 max-w-[200px] mx-auto">Vá para o Painel do Criador para simular interações e ganhar moedas de doadores!</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {receivedTransactions.map((tx) => (
                  <div key={tx.id} className="p-3 bg-zinc-950/60 border border-white/5 rounded-xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl filter drop-shadow select-none">{tx.giftIcon}</span>
                      <div>
                        <span className="text-xs font-bold text-white block font-sans">{tx.giftName}</span>
                        <span className="text-[10px] text-zinc-500 block">De: {tx.senderName}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-emerald-500 block">+R$ {(tx.coinValue * 0.10).toFixed(2)}</span>
                      <span className="text-[9px] text-zinc-650 block mt-0.5 font-mono">{tx.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* Payouts flow for creators */}
      {activeTab === 'payout' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
          
          {/* Left: Withdraw form */}
          <form onSubmit={handlePayoutSubmit} className="lg:col-span-7 bg-zinc-900/60 border border-white/10 p-6 rounded-2xl space-y-4 backdrop-blur-md shadow-2xl">
            <h3 className="text-xs font-black text-white uppercase tracking-widest border-b border-white/10 pb-3 flex items-center gap-1.5 select-none">
              <span className="text-emerald-450 text-sm">⚡</span>
              <span>Saque Turbo Pix (Fins Educacionais)</span>
            </h3>

            <div className="space-y-4 pt-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 shadow-sm font-mono">Tipo de Chave Pix</label>
                  <select
                    value={pixKeyType}
                    onChange={(e) => setPixKeyType(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                  >
                    <option value="cpf">CPF</option>
                    <option value="email">E-mail</option>
                    <option value="telefone">Telefone</option>
                    <option value="aleatoria">Chave Aleatória</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 shadow-sm font-mono">Valor do Saque (BRL)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 shadow-sm font-mono">Chave Pix Corretora</label>
                <input
                  type="text"
                  required
                  placeholder="Seu CPF, telefone ou e-mail cadastrado"
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/10 text-white rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10 text-[10px] text-zinc-400 space-y-1 font-sans">
                <p className="font-extrabold text-emerald-450 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Regulamento de Liquidação Financeira:
                </p>
                <p>• O tempo de depósito é de até 2 minutos após o clique.</p>
                <p>• Saques mínimos a partir de R$ 50,00.</p>
                <p>• ArenaPK retém taxa geral de 3% para cobrir processamentos de rede.</p>
              </div>

              <button
                type="submit"
                disabled={isProcessingPayout}
                className="w-full py-3 font-black uppercase tracking-wider text-white bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
              >
                {isProcessingPayout ? (
                  <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                ) : 'Confirmar e Transferir Saque via Pix'}
              </button>
            </div>
          </form>

          {/* Right: History of payout logs */}
          <div className="lg:col-span-5 bg-zinc-900/40 border border-white/10 p-6 rounded-2xl space-y-4 backdrop-blur-md shadow-2xl">
            <h3 className="text-xs font-black text-white uppercase tracking-widest border-b border-white/10 pb-3 select-none font-mono">
              Histórico de Retiradas Recentes
            </h3>

            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 font-sans">
              {payoutLogs.map((tx) => (
                <div key={tx.id} className="p-3 bg-zinc-950/80 rounded-xl text-xs flex justify-between items-center border border-white/5 shadow-inner">
                  <div className="space-y-0.5 mt-0.5">
                    <span className="font-bold text-zinc-100 block">Saque Pix • {tx.id}</span>
                    <span className="text-[10px] text-zinc-500 block font-mono">Chave: {tx.key} ({tx.date})</span>
                  </div>

                  <div className="text-right">
                    <span className="text-emerald-400 font-bold block font-mono">- R$ {tx.amount.toFixed(2)}</span>
                    <span className="text-[9px] text-emerald-400 font-black uppercase bg-emerald-500/10 border border-emerald-500/15 px-2 py-0.5 rounded mt-1 inline-block tracking-widest">
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
