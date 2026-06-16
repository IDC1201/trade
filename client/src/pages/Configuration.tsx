import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { AlertCircle, CheckCircle, Settings } from "lucide-react";

const configSchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
  apiSecret: z.string().min(1, "API secret is required"),
  environment: z.enum(["testnet", "mainnet"]),
  leverage: z.coerce.number().min(1).max(125),
  minFundingRate: z.coerce.number().min(0.0001),
  maxOpenPositions: z.coerce.number().min(1).max(20),
  tradeSizeUSDT: z.coerce.number().min(10),
});

type ConfigFormData = z.infer<typeof configSchema>;

export default function Configuration() {
  const [showApiSecret, setShowApiSecret] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);

  // Queries
  const config = trpc.config.get.useQuery();

  // Mutations
  const updateConfig = trpc.config.update.useMutation({
    onSuccess: () => {
      toast.success("Configuration updated successfully");
      config.refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update configuration: ${error.message}`);
    },
  });

  const testConnection = trpc.config.testConnection.useMutation({
    onSuccess: (data) => {
      toast.success(
        `Connected! Balance: ${data.balance.totalWalletBalance.toFixed(2)} USDT`
      );
    },
    onError: (error) => {
      toast.error(`Connection failed: ${error.message}`);
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(configSchema),
    defaultValues: {
      environment: "testnet" as const,
      leverage: 1,
      minFundingRate: 0.001,
      maxOpenPositions: 5,
      tradeSizeUSDT: 100,
    },
  }) as any;

  const environment = watch("environment");
  const apiKey = watch("apiKey");
  const apiSecret = watch("apiSecret");

  const onSubmit = (data: ConfigFormData) => {
    updateConfig.mutate(data);
  };

  const handleTestConnection = async () => {
    if (!apiKey || !apiSecret) {
      toast.error("Please enter API key and secret first");
      return;
    }

    setTestingConnection(true);
    testConnection.mutate({
      apiKey,
      apiSecret,
      testnet: environment === "testnet",
    });
    setTestingConnection(false);
  };

  if (config.isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Configuration</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your bot settings and API credentials
        </p>
      </div>

      <Tabs defaultValue="api" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="api">API Keys</TabsTrigger>
          <TabsTrigger value="risk">Risk Settings</TabsTrigger>
          <TabsTrigger value="trading">Trading Parameters</TabsTrigger>
        </TabsList>

        {/* API Keys Tab */}
        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Binance API Credentials
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Environment Selection */}
                <div className="space-y-2">
                  <Label htmlFor="environment">Environment</Label>
                  <Select
                    defaultValue={config.data?.environment || "testnet"}
                    onValueChange={(value) => {
                      // This is handled by react-hook-form
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="testnet">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Testnet</Badge>
                          <span className="text-sm">Safe for testing</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="mainnet">
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive">Mainnet</Badge>
                          <span className="text-sm">Live trading</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <input
                    type="hidden"
                    {...register("environment")}
                    value={environment}
                  />
                  <p className="text-xs text-muted-foreground">
                    {environment === "testnet"
                      ? "Using Binance Testnet - no real funds at risk"
                      : "Using Binance Mainnet - real funds will be traded"}
                  </p>
                </div>

                {/* API Key */}
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="Enter your Binance API key"
                    {...register("apiKey")}
                    className={errors.apiKey ? "border-red-500" : ""}
                  />
                  {errors.apiKey && (
                    <p className="text-xs text-red-500">
                      {errors.apiKey.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Get your API key from Binance Account → API Management
                  </p>
                </div>

                {/* API Secret */}
                <div className="space-y-2">
                  <Label htmlFor="apiSecret">API Secret</Label>
                  <div className="flex gap-2">
                    <Input
                      id="apiSecret"
                      type={showApiSecret ? "text" : "password"}
                      placeholder="Enter your Binance API secret"
                      {...register("apiSecret")}
                      className={errors.apiSecret ? "border-red-500" : ""}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowApiSecret(!showApiSecret)}
                    >
                      {showApiSecret ? "Hide" : "Show"}
                    </Button>
                  </div>
                  {errors.apiSecret && (
                    <p className="text-xs text-red-500">
                      {errors.apiSecret.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Keep this secret secure. Never share it with anyone.
                  </p>
                </div>

                {/* Test Connection */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={testingConnection || !apiKey || !apiSecret}
                  >
                    {testingConnection ? (
                      <>
                        <Spinner className="w-4 h-4 mr-2" />
                        Testing...
                      </>
                    ) : (
                      "Test Connection"
                    )}
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || updateConfig.isPending}
                  >
                    {isSubmitting || updateConfig.isPending ? (
                      <>
                        <Spinner className="w-4 h-4 mr-2" />
                        Saving...
                      </>
                    ) : (
                      "Save API Keys"
                    )}
                  </Button>
                </div>

                {/* Warning */}
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-700">
                    <p className="font-medium">Security Notice</p>
                    <p>
                      API keys are encrypted and stored securely on our servers.
                      We recommend using API keys with restricted permissions
                      (futures trading only).
                    </p>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risk Settings Tab */}
        <TabsContent value="risk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Risk Management</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Leverage */}
                <div className="space-y-2">
                  <Label htmlFor="leverage">Leverage</Label>
                  <Input
                    id="leverage"
                    type="number"
                    min="1"
                    max="125"
                    {...register("leverage")}
                    className={errors.leverage ? "border-red-500" : ""}
                  />
                  {errors.leverage && (
                    <p className="text-xs text-red-500">
                      {errors.leverage.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Trading leverage (1-125x). Higher leverage = higher risk.
                    Recommended: 1-5x
                  </p>
                </div>

                {/* Max Open Positions */}
                <div className="space-y-2">
                  <Label htmlFor="maxOpenPositions">
                    Max Open Positions
                  </Label>
                  <Input
                    id="maxOpenPositions"
                    type="number"
                    min="1"
                    max="20"
                    {...register("maxOpenPositions")}
                    className={
                      errors.maxOpenPositions ? "border-red-500" : ""
                    }
                  />
                  {errors.maxOpenPositions && (
                    <p className="text-xs text-red-500">
                      {errors.maxOpenPositions.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Maximum number of concurrent positions (1-20)
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || updateConfig.isPending}
                >
                  {isSubmitting || updateConfig.isPending ? (
                    <>
                      <Spinner className="w-4 h-4 mr-2" />
                      Saving...
                    </>
                  ) : (
                    "Save Risk Settings"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trading Parameters Tab */}
        <TabsContent value="trading" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Trading Parameters</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Min Funding Rate */}
                <div className="space-y-2">
                  <Label htmlFor="minFundingRate">
                    Minimum Funding Rate Threshold
                  </Label>
                  <Input
                    id="minFundingRate"
                    type="number"
                    step="0.0001"
                    min="0.0001"
                    {...register("minFundingRate")}
                    className={errors.minFundingRate ? "border-red-500" : ""}
                  />
                  {errors.minFundingRate && (
                    <p className="text-xs text-red-500">
                      {errors.minFundingRate.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Only trade pairs with funding rates above this threshold
                    (e.g., 0.001 = 0.1%)
                  </p>
                </div>

                {/* Trade Size */}
                <div className="space-y-2">
                  <Label htmlFor="tradeSizeUSDT">Trade Size (USDT)</Label>
                  <Input
                    id="tradeSizeUSDT"
                    type="number"
                    step="10"
                    min="10"
                    {...register("tradeSizeUSDT")}
                    className={errors.tradeSizeUSDT ? "border-red-500" : ""}
                  />
                  {errors.tradeSizeUSDT && (
                    <p className="text-xs text-red-500">
                      {errors.tradeSizeUSDT.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    USDT amount per trade (before leverage)
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || updateConfig.isPending}
                >
                  {isSubmitting || updateConfig.isPending ? (
                    <>
                      <Spinner className="w-4 h-4 mr-2" />
                      Saving...
                    </>
                  ) : (
                    "Save Trading Parameters"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
