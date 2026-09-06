import multiprocessing
import time
import sys

# TC-68 [TSK-304]: Gia lap su co CPU qua tai de test he thong bao dong Critical Alert
# Dung ket hop voi collector_agent.py dang chay -> quan sat CPU tang cao tren Web Command Center


def burn_cpu(duration_sec):
    end_time = time.time() + duration_sec
    while time.time() < end_time:
        pass  # vong lap rong, chiem het 1 luong CPU


def run_stress_test(duration_sec=60, num_cores=None):
    if num_cores is None:
        num_cores = multiprocessing.cpu_count()  # dung het so core hien co -> CPU len ~100%

    print(f"[STRESS TEST] Bat dau, dung {num_cores} core, trong {duration_sec}s...")
    print("[STRESS TEST] Quan sat CPU tren Collector Agent / Web Command Center de xem canh bao co kich hoat khong.")

    processes = []
    for _ in range(num_cores):
        p = multiprocessing.Process(target=burn_cpu, args=(duration_sec,))
        p.start()
        processes.append(p)

    for p in processes:
        p.join()

    print("[STRESS TEST] Hoan tat, CPU tro ve binh thuong.")


if __name__ == "__main__":
    # Cho phep truyen thoi gian test qua command line, vd: python stress_test_cpu.py 30
    duration = int(sys.argv[1]) if len(sys.argv) > 1 else 60
    run_stress_test(duration_sec=duration)
