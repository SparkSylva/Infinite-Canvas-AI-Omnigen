'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useUserSettingStore } from '@/hooks/stores/user-setting';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/shadcn-ui/dialog';
import { Label, Input, Button, Checkbox } from '@/components/ui';
import { Check, Settings } from 'lucide-react';
import { toast } from 'sonner';

interface SettingDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export const SettingDialog: React.FC<SettingDialogProps> = ({ isOpen, onOpenChange }) => {

  const setSetting = useUserSettingStore((s) => s.setSetting);
  const removeSetting = useUserSettingStore((s) => s.removeSetting);

  // initial from store (string fallback)
  const initialKey = useMemo(
    () => useUserSettingStore.getState().getSetting('falApiKey') as string ?? '',
    []
  );
  const [apiKey, setApiKey] = useState<string>(initialKey);

  // new: control whether to save permanently
  const [isPersistent, setIsPersistent] = useState<boolean>(false);

  // when open dialog, sync latest store value (avoid expired when window is changed)
  useEffect(() => {
    if (isOpen) {
      const latest = useUserSettingStore.getState().getSetting('falApiKey') as string ?? '';
      setApiKey(latest);

      // check if the setting has been saved permanently
      const hasPersistentKey = useUserSettingStore.getState().hasSetting('falApiKey');
      setIsPersistent(hasPersistentKey);
    }
  }, [isOpen]);

  // save setting function
  const saveApiKey = () => {
    if (isPersistent) {
      // save permanently
      setSetting('falApiKey', apiKey, {
        persistent: true,
        category: 'auth',
        description: 'FAL API key (permanent)'
      });
      toast.success('API key saved permanently');
    } else {
      // save temporarily
      setSetting('falApiKey', apiKey, {
        category: 'auth',
        description: 'FAL API key (temporary)'
      });
      toast.success('API key saved temporarily');
    }
  };

  // 移除设置的函数
  const removeApiKey = () => {
    // remove setting (will remove both temporary and permanent)
    removeSetting('falApiKey');
    setApiKey('');
    toast.success('API key removed');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings className="h-4 w-4 cursor-pointer" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-[85vw] md:max-w-[65vw] max-h-[70vh] md:max-h-[80vh] flex flex-col mw-auto md:w-auto">
        <DialogTitle>Setting</DialogTitle>

        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">FAL API Key</Label>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>Use your key to try this online demo</p>

                <p>Your API key is stored locally and sent directly to FAL API, never through our servers.</p>

                <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                  <p className="text-xs font-medium text-foreground">💡 Better alternatives:</p>
                  <div className="space-y-1 text-xs">
                  
                    <div className="flex items-center gap-2">
                      <span className="text-green-500">📁</span>
                      <span>Clone <a href='https://github.com/SparkSylva/Infinite-Canvas-AI-Omnigen' target='_blank'  className='underline hover:text-foreground'>opensoure project</a> for local setup</span>
                    </div>
                  </div>
                </div>
              </div>

              <Input
                id="api-key"
                type="password"
                placeholder="Enter your API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="font-mono"
                style={{ fontSize: '16px' }}
              />

              <p className="text-xs text-muted-foreground">
                Get your API key from{' '}
                <a
                  href="https://fal.ai/dashboard/keys"
                  target="_blank"
                  className="underline hover:text-foreground"
                >
                  fal.ai/dashboard/keys
                </a>
              </p>
            </div>

            {/* 永久保存开关 */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="persistent-save"
                  checked={isPersistent}
                  onCheckedChange={(checked) => setIsPersistent(checked === true)}
                />
                <Label htmlFor="persistent-save" className="text-sm font-medium">
                  Save API key permanently
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                {isPersistent
                  ? 'API key will be saved to your browser and persist across sessions'
                  : 'API key will only be stored temporarily in memory'
                }
              </p>
            </div>

            {!!apiKey && (
              <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-3 flex flex-col gap-2 ">
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <Check className="h-4 w-4" />
                  <span>
                    {isPersistent
                      ? 'API key will be saved permanently'
                      : 'Currently using temporary API key'
                    }
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {isPersistent
                    ? 'API key will be stored in your browser and persist across sessions'
                    : 'API key temporarily stored in memory, will be cleared when you refresh the page'
                  }
                </p>
              </div>
            )}

            <div className="flex justify-between gap-2">
              <Button
                onClick={saveApiKey}
                disabled={!apiKey}
                className="flex-1"
              >
                {isPersistent ? 'Save Permanently' : 'Save Temporarily'}
              </Button>

              <Button
                onClick={removeApiKey}
                disabled={!apiKey}
                variant="outline"
              >
                Remove Key
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
