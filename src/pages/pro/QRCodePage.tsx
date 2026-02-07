import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getQueueInfo, type QueueInfo } from "@/api/queue";
import { toast } from "sonner";

export default function QRCodePage() {
  const { queueId } = useParams<{ queueId: string }>();
  const [data, setData] = useState<QueueInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!queueId) return;
    async function load() {
      try {
        const queueData = await getQueueInfo(parseInt(queueId!, 10));
        setData(queueData);
      } catch (error) {
        toast.error("Erreur de chargement");
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [queueId]);

  const qrUrl = data?.slug ? `${window.location.origin}/q/${data.slug}` : null;

  const handleDownload = () => {
    const svg = document.getElementById("qr-code");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngUrl = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `byewait-${data?.slug ?? "qrcode"}.png`;
      downloadLink.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    if (qrUrl) {
      navigator.clipboard.writeText(qrUrl);
      toast.success("Lien copie");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-pulse text-slate-400">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4 text-white">
      <div className="max-w-md mx-auto space-y-6">
        {/* Back button */}
        <Link to={`/dashboard/${queueId}`}>
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white"
          >
            ← Retour
          </Button>
        </Link>

        {/* QR Code card */}
        <Card className="bg-slate-800 border-slate-700 print:bg-white print:border-none">
          <CardHeader className="text-center">
            <CardTitle className="text-slate-200 print:text-black">
              {data?.name}
            </CardTitle>
            <p className="text-slate-400 text-sm print:text-gray-600">
              Scannez pour prendre un ticket
            </p>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {qrUrl && (
              <>
                <div className="bg-white p-4 rounded-lg">
                  <QRCodeSVG
                    id="qr-code"
                    value={qrUrl}
                    size={256}
                    level="H"
                    includeMargin
                  />
                </div>
                <p className="text-xs text-slate-500 mt-4 text-center break-all print:text-gray-600">
                  {qrUrl}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col gap-3 print:hidden">
          <div className="flex gap-3">
            <Button
              className="flex-1 bg-violet-600 hover:bg-violet-700"
              onClick={handleDownload}
            >
              Telecharger PNG
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-slate-600 text-slate-300"
              onClick={handlePrint}
            >
              Imprimer
            </Button>
          </div>
          <Button
            variant="outline"
            className="w-full border-slate-600 text-slate-300"
            onClick={handleCopyLink}
          >
            Copier le lien
          </Button>
        </div>

        {/* Instructions */}
        <Card className="bg-slate-800 border-slate-700 print:hidden">
          <CardContent className="pt-4">
            <h3 className="font-medium mb-2 text-slate-200">Instructions</h3>
            <ul className="text-sm text-slate-400 space-y-1">
              <li>• Affichez ce QR Code dans votre salle d'attente</li>
              <li>
                • Partagez le lien sur vos reseaux (Instagram, WhatsApp...)
              </li>
              <li>• Les clients scannent et prennent leur ticket</li>
              <li>• Ils seront notifies quand leur tour approche</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
