import { useEffect, useMemo, useState } from "react";

function DurationPicker({ open, initialMinutes = 0, onCancel, onConfirm }) {
  const initial = useMemo(() => {
    const t = Math.max(0, Number(initialMinutes || 0));
    const days = Math.floor(t / 1440);
    const hours = Math.floor((t % 1440) / 60);
    const minutes = t % 60;
    return { days, hours, minutes };
  }, [initialMinutes]);

  const [days, setDays] = useState(initial.days);
  const [hours, setHours] = useState(initial.hours);
  const [minutes, setMinutes] = useState(initial.minutes);

  useEffect(() => {
    if (!open) return;
    setDays(initial.days);
    setHours(initial.hours);
    setMinutes(initial.minutes);
  }, [open, initial]);

  const clampInt = (v, min, max) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return min;
    const i = Math.trunc(n);
    return Math.min(max, Math.max(min, i));
  };

  const totalMinutes = days * 1440 + hours * 60 + minutes;

  if (!open) return null;

  return (
    <>
      <div
        className="modal fade show"
        style={{ display: "block" }}
        tabIndex={-1}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Select Duration</h5>
              <button type="button" className="btn-close" onClick={onCancel} />
            </div>

            <div className="modal-body">
              <div className="row g-3">
                <div className="col-4 text-center">
                  <div className="fw-semibold mb-2">Days</div>
                  <div className="d-flex justify-content-center align-items-center gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setDays((d) => Math.max(0, d - 1))}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      className="form-control text-center"
                      style={{ maxWidth: 90 }}
                      value={days}
                      min={0}
                      onChange={(e) =>
                        setDays(clampInt(e.target.value, 0, 365))
                      }
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setDays((d) => Math.min(365, d + 1))}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="col-4 text-center">
                  <div className="fw-semibold mb-2">Hours</div>
                  <div className="d-flex justify-content-center align-items-center gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setHours((h) => Math.max(0, h - 1))}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      className="form-control text-center"
                      style={{ maxWidth: 90 }}
                      value={hours}
                      min={0}
                      max={23}
                      onChange={(e) =>
                        setHours(clampInt(e.target.value, 0, 23))
                      }
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setHours((h) => Math.min(23, h + 1))}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="col-4 text-center">
                  <div className="fw-semibold mb-2">Minutes</div>
                  <div className="d-flex justify-content-center align-items-center gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setMinutes((m) => Math.max(0, m - 1))}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      className="form-control text-center"
                      style={{ maxWidth: 90 }}
                      value={minutes}
                      min={0}
                      max={59}
                      onChange={(e) =>
                        setMinutes(clampInt(e.target.value, 0, 59))
                      }
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setMinutes((m) => Math.min(59, m + 1))}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4 text-center text-body-secondary">
                Total: {days}d {hours}h {minutes}m
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => {
                  setDays(0);
                  setHours(0);
                  setMinutes(0);
                }}
              >
                Reset
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onCancel}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => onConfirm(totalMinutes)}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="modal-backdrop fade show" onClick={onCancel} />
    </>
  );
}

export default DurationPicker;
