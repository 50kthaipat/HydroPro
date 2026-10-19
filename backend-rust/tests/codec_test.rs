use hydroflow_core::codec::Db1Raw;

#[test]
fn test_db1_memory_size() {
    assert_eq!(std::mem::size_of::<Db1Raw>(), 28);
}
