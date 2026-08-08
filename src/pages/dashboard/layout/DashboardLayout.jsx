import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import BottomNav from './BottomNav';
import Footer from './Footer';
import styles from './DashboardLayout.module.scss';

export default function DashboardLayout() {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.main}>
        <Topbar />
        <div className={styles.content}>
          <Outlet />
        </div>
        <Footer />
        <BottomNav />
      </div>
    </div>
  );
}
