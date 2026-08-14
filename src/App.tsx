import React, { useState, useEffect } from 'react';
import { ScreenType, InventoryItem, HistoryRecord } from './types';
import { INITIAL_ITEMS, INITIAL_HISTORY } from './mockData';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DataEntryScreen } from './components/DataEntryScreen';
import { CatalogScreen } from './components/CatalogScreen';
import { ItemDetailScreen } from './components/ItemDetailScreen';
import { ReportScreen } from './components/ReportScreen';
import { HistoryScreen } from './components/HistoryScreen';
import { NewItemModal } from './components/NewItemModal';
import { NewSlipModal } from './components/NewSlipModal';
import { HelpModal } from './components/HelpModal';
import { NotificationModal } from './components/NotificationModal';
import { GoogleSheetsSyncModal } from './components/GoogleSheetsSyncModal';
import { subscribeToAuthChanges, User } from './services/auth';

export default function App() {
  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Subscribe to Firebase Auth
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Screen state
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('entry');
  const [selectedItemId, setSelectedItemId] = useState<string>('NLTC.0196');

  // Search query
  const [searchQuery, setSearchQuery] = useState('');

  // Items State (persisted to localStorage)
  const [items, setItems] = useState<InventoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('nha_khuon_items');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_ITEMS;
  });

  // History Records State (persisted to localStorage)
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>(() => {
    try {
      const saved = localStorage.getItem('nha_khuon_history');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_HISTORY;
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('nha_khuon_items', JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items]);

  useEffect(() => {
    try {
      localStorage.setItem('nha_khuon_history', JSON.stringify(historyRecords));
    } catch {
      // ignore
    }
  }, [historyRecords]);

  // Modal States
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<InventoryItem | null>(null);
  const [isNewSlipModalOpen, setIsNewSlipModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isGoogleSheetsOpen, setIsGoogleSheetsOpen] = useState(false);

  // Navigation Helpers
  const handleNavigate = (screen: ScreenType) => {
    setCurrentScreen(screen);
  };

  const handleSelectItemDetail = (itemId: string) => {
    setSelectedItemId(itemId);
    setCurrentScreen('detail');
  };

  // Handlers for Data Changes
  const handleSaveItem = (item: InventoryItem) => {
    setItems((prev) => {
      const existsIndex = prev.findIndex((i) => i.id === item.id);
      if (existsIndex >= 0) {
        const next = [...prev];
        next[existsIndex] = item;
        return next;
      } else {
        return [item, ...prev];
      }
    });
  };

  const handleDeleteItem = (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    if (selectedItemId === itemId) {
      const remaining = items.filter((i) => i.id !== itemId);
      if (remaining.length > 0) {
        setSelectedItemId(remaining[0].id);
      }
    }
  };

  const handleOpenEditItem = (item: InventoryItem) => {
    setItemToEdit(item);
    setIsNewItemModalOpen(true);
  };

  const handleImportItemsFromSheet = (importedItems: InventoryItem[]) => {
    if (importedItems.length > 0) {
      setItems(importedItems);
      if (!importedItems.some((it) => it.id === selectedItemId)) {
        setSelectedItemId(importedItems[0].id);
      }
    }
  };

  // Save Entry Form Slip
  const handleSaveEntrySlip = (
    week: string,
    rows: { itemId: string; importQty: number; newStockQty: number; exportQty: number }[]
  ) => {
    const timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ');

    const newHistoryEntries: HistoryRecord[] = rows
      .filter((r) => r.importQty > 0 || r.exportQty > 0)
      .map((r, i) => {
        const it = items.find((item) => item.id === r.itemId);
        return {
          id: `ENTRY-${Date.now()}-${i}`,
          dateTime: timestamp,
          week: week.replace('Tuần ', 'W'),
          itemId: r.itemId,
          itemName: it ? it.name : r.itemId,
          importQty: r.importQty,
          stockQty: r.newStockQty,
          exportQty: r.exportQty,
          documentCode: `PN-${new Date().toISOString().slice(2, 7).replace('-', '')}-${100 + i}`,
          type: r.importQty > 0 ? 'Nhập' : 'Xuất',
          notes: `Nhập định kỳ ${week}`
        };
      });

    if (newHistoryEntries.length > 0) {
      setHistoryRecords((prev) => [...newHistoryEntries, ...prev]);
    }

    // Update items current stock
    setItems((prev) => {
      return prev.map((it) => {
        const matchingRow = rows.find((r) => r.itemId === it.id);
        if (matchingRow) {
          return {
            ...it,
            currentStock: matchingRow.newStockQty,
            totalImport: it.totalImport + matchingRow.importQty,
            totalExport: it.totalExport + matchingRow.exportQty,
            lastUpdated: 'Hôm nay, ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
          };
        }
        return it;
      });
    });
  };

  // Create Quick Transaction Slip
  const handleCreateQuickSlip = (slipData: {
    type: 'Nhập' | 'Xuất';
    docCode: string;
    itemId: string;
    quantity: number;
    notes: string;
  }) => {
    const timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const it = items.find((i) => i.id === slipData.itemId);
    const itemName = it ? it.name : slipData.itemId;
    const currentStock = it ? it.currentStock : 0;
    const newStock =
      slipData.type === 'Nhập'
        ? currentStock + slipData.quantity
        : Math.max(0, currentStock - slipData.quantity);

    const newRecord: HistoryRecord = {
      id: `SLIP-${Date.now()}`,
      dateTime: timestamp,
      week: 'W44',
      itemId: slipData.itemId,
      itemName,
      importQty: slipData.type === 'Nhập' ? slipData.quantity : 0,
      stockQty: newStock,
      exportQty: slipData.type === 'Xuất' ? slipData.quantity : 0,
      documentCode: slipData.docCode,
      type: slipData.type,
      notes: slipData.notes
    };

    setHistoryRecords((prev) => [newRecord, ...prev]);

    // Update item stock
    setItems((prev) =>
      prev.map((i) => {
        if (i.id === slipData.itemId) {
          return {
            ...i,
            currentStock: newStock,
            totalImport: i.totalImport + (slipData.type === 'Nhập' ? slipData.quantity : 0),
            totalExport: i.totalExport + (slipData.type === 'Xuất' ? slipData.quantity : 0),
            lastUpdated: 'Hôm nay, ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
          };
        }
        return i;
      })
    );
  };

  const selectedItem =
    items.find((i) => i.id === selectedItemId) || items[0] || INITIAL_ITEMS[0];

  const lowStockCount = items.filter(
    (it) => it.currentStock <= (it.minStockThreshold || 50)
  ).length;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f8f9fa] text-[#191c1d]">
      {/* Sidebar Navigation (Fixed on Desktop, Drawer on Mobile) */}
      <Sidebar
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        onOpenNewSlip={() => setIsNewSlipModalOpen(true)}
        onOpenGoogleSheets={() => setIsGoogleSheetsOpen(true)}
        onOpenHelp={() => setIsHelpModalOpen(true)}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 h-full lg:ml-64 overflow-hidden">
        {/* Top Header */}
        <Header
          currentScreen={currentScreen}
          onNavigate={handleNavigate}
          searchQuery={searchQuery}
          onSearchChange={(q) => {
            setSearchQuery(q);
            if (q && currentScreen !== 'catalog' && currentScreen !== 'history') {
              setCurrentScreen('catalog');
            }
          }}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenGoogleSheets={() => setIsGoogleSheetsOpen(true)}
          currentUser={currentUser}
          unreadCount={lowStockCount}
        />

        {/* Dynamic Screen View */}
        <main className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-6 bg-[#f8f9fa]">
          {currentScreen === 'entry' && (
            <DataEntryScreen
              items={items}
              onSaveSlip={handleSaveEntrySlip}
              onNavigateToDetail={handleSelectItemDetail}
            />
          )}

          {currentScreen === 'catalog' && (
            <CatalogScreen
              items={items}
              onSelectItem={handleSelectItemDetail}
              onOpenNewItemModal={() => {
                setItemToEdit(null);
                setIsNewItemModalOpen(true);
              }}
              onEditItem={handleOpenEditItem}
              onDeleteItem={handleDeleteItem}
              onOpenGoogleSheets={() => setIsGoogleSheetsOpen(true)}
              searchFilter={searchQuery}
            />
          )}

          {currentScreen === 'detail' && (
            <ItemDetailScreen
              item={selectedItem}
              onBack={() => setCurrentScreen('catalog')}
              onEdit={handleOpenEditItem}
              onViewAllHistory={() => setCurrentScreen('history')}
            />
          )}

          {currentScreen === 'report' && (
            <ReportScreen
              items={items}
              onNavigateToDetail={handleSelectItemDetail}
              onOpenGoogleSheets={() => setIsGoogleSheetsOpen(true)}
            />
          )}

          {currentScreen === 'history' && (
            <HistoryScreen
              records={historyRecords}
              onViewItemDetail={handleSelectItemDetail}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <NewItemModal
        isOpen={isNewItemModalOpen}
        onClose={() => {
          setIsNewItemModalOpen(false);
          setItemToEdit(null);
        }}
        onSave={handleSaveItem}
        itemToEdit={itemToEdit}
      />

      <NewSlipModal
        isOpen={isNewSlipModalOpen}
        onClose={() => setIsNewSlipModalOpen(false)}
        items={items}
        onCreated={handleCreateQuickSlip}
      />

      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />

      <NotificationModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        items={items}
        onSelectItem={handleSelectItemDetail}
      />

      {/* Google Sheets Sync & Workspace Modal */}
      <GoogleSheetsSyncModal
        isOpen={isGoogleSheetsOpen}
        onClose={() => setIsGoogleSheetsOpen(false)}
        items={items}
        history={historyRecords}
        onImportItems={handleImportItemsFromSheet}
        currentUser={currentUser}
        onUserChanged={(user) => setCurrentUser(user)}
      />
    </div>
  );
}
