import { useState } from 'react'
import Modal from './Modal'

export function useConfirm() {
  const [state, setState] = useState(null) // { message, onConfirm, onCancel? }

  const confirm = (message, onConfirm) => {
    setState({ message, onConfirm })
  }

  const Dialog = () => {
    if (!state) return null

    const handleConfirm = () => {
      state.onConfirm?.()
      setState(null)
    }

    const handleCancel = () => {
      setState(null)
    }

    return (
      <Modal
        open={true}
        onClose={handleCancel}
        title="Confirm"
        footer={
          <>
            <button onClick={handleCancel} style={{ padding: '6px 14px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer' }}>
              Cancel
            </button>
            <button onClick={handleConfirm} style={{ padding: '6px 14px', borderRadius: 7, border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer', fontWeight: 600 }}>
              Confirm
            </button>
          </>
        }
      >
        <p style={{ margin: 0, fontSize: 14 }}>{state.message}</p>
      </Modal>
    )
  }

  return { confirm, ConfirmDialog: Dialog }
}
