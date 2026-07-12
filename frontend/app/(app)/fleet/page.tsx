"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Filter, Info, FolderOpen, Trash2, ExternalLink } from "lucide-react";
import {
  Button,
  Field,
  Input,
  Panel,
  PageHeader,
  RuleNote,
  Select,
  StatusPill,
  Table,
  TableFooter,
  Td,
  Th,
  Tr,
  type Tone,
} from "@/components/ui";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/async";
import { useVehicles, useCreateVehicle, useVehicleDocuments, useAddVehicleDocument, useDeleteVehicleDocument } from "@/lib/api/hooks";
import type { VehicleStatus } from "@/lib/api/types";
import { useAuth } from "@/lib/auth";

const STATUS_TONE: Record<VehicleStatus, Tone> = {
  Available: "success",
  "On Trip": "warn",
  "In Shop": "danger",
  Retired: "neutral",
};

const ALL_TYPES = "All Types";
const ALL_STATUS = "All Status";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function FleetPage() {
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useVehicles();
  const createVehicle = useCreateVehicle();

  const isManager = user?.role?.name === "Fleet Manager";

  const [type, setType] = useState(ALL_TYPES);
  const [status, setStatus] = useState(ALL_STATUS);
  const [query, setQuery] = useState("");

  // Add Vehicle Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [regNo, setRegNo] = useState("");
  const [modelName, setModelName] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [capacity, setCapacity] = useState("");
  const [odometerVal, setOdometerVal] = useState("");
  const [costVal, setCostVal] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [docsModalId, setDocsModalId] = useState<number | null>(null);

  const resetForm = () => {
    setRegNo("");
    setModelName("");
    setVehicleType("");
    setCapacity("");
    setOdometerVal("");
    setCostVal("");
    setErrorMsg("");
  };

  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    createVehicle.mutate({
      registrationNumber: regNo,
      model: modelName,
      type: vehicleType,
      maxLoadCapacity: Number(capacity),
      odometer: Number(odometerVal),
      acquisitionCost: Number(costVal),
      status: "Available"
    }, {
      onSuccess: () => {
        resetForm();
        setIsModalOpen(false);
      },
      onError: (err) => {
        setErrorMsg(err instanceof Error ? err.message : "Failed to create vehicle");
      }
    });
  };

  const vehicles = useMemo(() => data ?? [], [data]);

  const typeOptions = useMemo(
    () => [ALL_TYPES, ...Array.from(new Set(vehicles.map((v) => v.type)))],
    [vehicles],
  );

  const rows = useMemo(
    () =>
      vehicles.filter(
        (v) =>
          (type === ALL_TYPES || v.type === type) &&
          (status === ALL_STATUS || v.status === status) &&
          v.registrationNumber.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [vehicles, type, status, query],
  );

  const resetFilters = () => {
    setType(ALL_TYPES);
    setStatus(ALL_STATUS);
    setQuery("");
  };

  return (
    <>
      <PageHeader
        crumbs={["Fleet", "Registry"]}
        title="Vehicle Registry"
        subtitle="Manage and audit the centralized transportation asset database."
        action={
          isManager ? (
            <Button
              icon={<Plus className="size-3.5" strokeWidth={3} />}
              onClick={() => setIsModalOpen(true)}
            >
              Add Vehicle
            </Button>
          ) : undefined
        }
      />

      <div className="glass flex items-end gap-4 rounded-xl px-4 pb-4 pt-6">
        <Field label="Vehicle Type">
          <Select
            options={typeOptions}
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-44"
          />
        </Field>
        <Field label="Service Status">
          <Select
            options={[
              ALL_STATUS,
              "Available",
              "On Trip",
              "In Shop",
              "Retired",
            ]}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-44"
          />
        </Field>
        <Field label="Registration Number" className="flex-1">
          <Input
            placeholder="Search reg. no (e.g. GJ01AB...)"
            icon={<Search className="size-3.5" />}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </Field>
        <Button
          variant="ghost"
          className="px-2 pb-2.5 text-sm"
          onClick={resetFilters}
        >
          <Filter className="size-4" />
          Reset Filters
        </Button>
      </div>

      {error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <Panel className="overflow-hidden">
          {isLoading ? (
            <TableSkeleton cols={7} />
          ) : rows.length === 0 ? (
            <EmptyState
              title="No vehicles yet"
              hint={
                vehicles.length === 0
                  ? "Add a vehicle to start building the asset registry."
                  : "No assets match the current filters."
              }
            />
          ) : (
            <>
              <Table>
                <thead>
                  <tr>
                    <Th>Reg No.</Th>
                    <Th>Name/Model</Th>
                    <Th>Type</Th>
                    <Th>Capacity</Th>
                    <Th align="right">Odometer</Th>
                    <Th align="right">Acq. Cost</Th>
                    <Th>Status</Th>
                    <Th align="right">Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((v) => (
                    <Tr key={v.id}>
                      <Td mono className="text-[13px] text-accent">
                        {v.registrationNumber}
                      </Td>
                      <Td>
                        <span className="text-ink">{v.model} </span>
                        <span className="block text-[10px] font-bold text-muted">
                          {v.type}
                        </span>
                      </Td>
                      <Td className="text-muted">{v.type}</Td>
                      <Td>{v.maxLoadCapacity}kg</Td>
                      <Td align="right" mono>
                        {v.odometer.toLocaleString()} km
                      </Td>
                      <Td align="right" mono>
                        {currency.format(v.acquisitionCost)}
                      </Td>
                      <Td>
                        <StatusPill tone={STATUS_TONE[v.status] ?? "neutral"}>
                          {v.status}
                        </StatusPill>
                      </Td>
                      <Td align="right">
                        <Button 
                          variant="outline" 
                          className="px-2 py-1 text-xs"
                          onClick={() => setDocsModalId(v.id)}
                        >
                          <FolderOpen className="size-3" />
                          Docs
                        </Button>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
              <TableFooter
                summary={`Showing 1-${rows.length} of ${rows.length} assets`}
                pages={1}
                current={1}
              />
            </>
          )}
        </Panel>
      )}

      <RuleNote icon={<Info className="size-4 shrink-0 text-muted" />}>
        <span className="font-bold text-ink">Registry Policy:</span> Registration
        No. must be unique <span className="text-line">•</span> Retired/In Shop
        vehicles are hidden from Trip Dispatcher view.
      </RuleNote>

      {/* Add Vehicle Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass w-full max-w-md p-6 rounded-xl flex flex-col gap-6 shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-line">
            <h2 className="text-xl font-bold text-ink">Add New Vehicle</h2>
            <form onSubmit={handleAddVehicle} className="flex flex-col gap-4">
              <Field label="Registration Number">
                <Input required placeholder="MH-12-HE-05" value={regNo} onChange={e => setRegNo(e.target.value)} />
              </Field>
              <Field label="Model Name">
                <Input required placeholder="Tata Ace" value={modelName} onChange={e => setModelName(e.target.value)} />
              </Field>
              <Field label="Vehicle Type">
                <Input required placeholder="Truck" value={vehicleType} onChange={e => setVehicleType(e.target.value)} />
              </Field>
              <div className="flex gap-4">
                <Field label="Capacity (kg)" className="flex-1">
                  <Input required type="number" min="1" placeholder="5000" value={capacity} onChange={e => setCapacity(e.target.value)} />
                </Field>
                <Field label="Odometer (km)" className="flex-1">
                  <Input required type="number" min="0" placeholder="1000" value={odometerVal} onChange={e => setOdometerVal(e.target.value)} />
                </Field>
              </div>
              <Field label="Acquisition Cost (INR)">
                <Input required type="number" min="1" placeholder="25000" value={costVal} onChange={e => setCostVal(e.target.value)} />
              </Field>

              {errorMsg && <p className="text-sm text-danger">{errorMsg}</p>}

              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1 justify-center py-3 text-sm" disabled={createVehicle.isPending}>
                  {createVehicle.isPending ? "Adding..." : "Add Vehicle"}
                </Button>
                <Button variant="outline" className="flex-1 justify-center py-3 text-sm" onClick={() => { resetForm(); setIsModalOpen(false); }}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Documents Modal */}
      {docsModalId !== null && (
        <VehicleDocumentsModal 
          vehicleId={docsModalId} 
          onClose={() => setDocsModalId(null)} 
          regNo={vehicles.find(v => v.id === docsModalId)?.registrationNumber || ""} 
        />
      )}
    </>
  );
}

function VehicleDocumentsModal({ vehicleId, regNo, onClose }: { vehicleId: number; regNo: string; onClose: () => void }) {
  const { data: docs = [], isLoading } = useVehicleDocuments(vehicleId);
  const addDoc = useAddVehicleDocument(vehicleId);
  const deleteDoc = useDeleteVehicleDocument(vehicleId);

  const [docType, setDocType] = useState("Registration");
  const [docNum, setDocNum] = useState("");
  const [expiry, setExpiry] = useState("");
  const [docUrl, setDocUrl] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    addDoc.mutate({ documentType: docType, documentNumber: docNum, expiryDate: expiry, documentUrl: docUrl }, {
      onSuccess: () => {
        setDocType("Registration");
        setDocNum("");
        setExpiry("");
        setDocUrl("");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass w-full max-w-2xl p-6 rounded-xl flex flex-col gap-6 shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-line max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-ink">Documents: {regNo}</h2>
          <Button variant="outline" className="px-3 py-1 text-sm" onClick={onClose}>Close</Button>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-bold text-muted uppercase">Existing Documents</h3>
          {isLoading ? <p className="text-sm text-muted">Loading...</p> : docs.length === 0 ? <p className="text-sm text-muted">No documents found.</p> : (
            <div className="flex flex-col gap-2">
              {docs.map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg bg-surface-4 border border-line">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-ink">{doc.documentType} <span className="text-muted font-normal ml-1">#{doc.documentNumber}</span></span>
                    <span className="text-xs text-muted">Expires: {doc.expiryDate}</span>
                  </div>
                  <div className="flex gap-2">
                    {doc.documentUrl && (
                      <a href={doc.documentUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-accent hover:underline">
                        <ExternalLink className="size-3" /> View
                      </a>
                    )}
                    <button type="button" onClick={() => deleteDoc.mutate(doc.id)} className="text-danger hover:text-danger/80">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="h-px w-full bg-line" />

        <form onSubmit={handleAdd} className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-muted uppercase">Add New Document</h3>
          <div className="flex gap-4">
            <Field label="Type" className="flex-1">
              <Select options={["Registration", "Insurance", "Permit", "Emission", "Other"]} value={docType} onChange={e => setDocType(e.target.value)} />
            </Field>
            <Field label="Doc Number" className="flex-1">
              <Input required placeholder="DOC-12345" value={docNum} onChange={e => setDocNum(e.target.value)} />
            </Field>
          </div>
          <div className="flex gap-4">
            <Field label="Expiry Date" className="flex-1">
              <Input required type="date" value={expiry} onChange={e => setExpiry(e.target.value)} />
            </Field>
            <Field label="File URL (Optional)" className="flex-1">
              <Input type="url" placeholder="https://drive.google.com/..." value={docUrl} onChange={e => setDocUrl(e.target.value)} />
            </Field>
          </div>
          <Button type="submit" className="w-full justify-center py-3 text-sm mt-2" disabled={addDoc.isPending}>
            {addDoc.isPending ? "Adding..." : "Add Document"}
          </Button>
        </form>
      </div>
    </div>
  );
}
